'use strict';

// 공용 유틸리티: DB-1 완료조건(접속 확인)을 전제로, DB-2~DB-6 통합 테스트가 공통으로 사용하는
// 테스트 전용 DB(todolist_test) 준비/접속 문자열 계산 로직.
// - 개발 DB(todolist_dev)를 오염시키지 않기 위해 별도 DB(todolist_test)를 사용한다.
// - 관리자 접속 문자열(backend/.env의 POSTGRES_CONNECTION_STRING)로 todolist_test를 생성하며,
//   이미 존재하면 스킵한다. todolist_app 계정이 아직 없을 수 있으므로 계정 생성 실패는 무시한다.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { Client } = require('pg');

const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..');
const ENV_PATH = path.join(BACKEND_ROOT, '.env');
const TEST_DB_NAME = 'todolist_test';

/**
 * .env 파일을 (dotenv 의존 없이) 최소한으로 파싱한다.
 * dotenv는 다른 에이전트가 backend/package.json에 추가할 예정이라 아직 없을 수 있어
 * 테스트 유틸리티 자체는 fs만으로 동작하도록 방어적으로 구현한다.
 */
function loadEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) {
    return result;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const fileEnv = loadEnvFile(ENV_PATH);

function getEnv(key) {
  return process.env[key] ?? fileEnv[key];
}

const ADMIN_CONNECTION_STRING = getEnv('POSTGRES_CONNECTION_STRING');
const DEV_DATABASE_URL = getEnv('DATABASE_URL');

function isValidIdentifier(value) {
  return typeof value === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

function quoteIdent(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function escapeLiteral(value) {
  return String(value).replace(/'/g, "''");
}

function parseDbUrl(databaseUrl) {
  if (!databaseUrl) return null;
  try {
    const url = new URL(databaseUrl);
    return {
      user: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || ''),
    };
  } catch (err) {
    console.log(`[db-setup] DATABASE_URL 파싱 실패: ${err.message}`);
    return null;
  }
}

function toTestDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return undefined;
  try {
    const url = new URL(databaseUrl);
    url.pathname = `/${TEST_DB_NAME}`;
    return url.toString();
  } catch (err) {
    console.log(`[db-setup] 접속 문자열 변환 실패: ${err.message}`);
    return undefined;
  }
}

// DATABASE_URL(개발 DB 접속 문자열)이 있으면 그 계정/비밀번호를 그대로 재사용해
// todolist_test로만 DB 이름을 바꾼다. 아직 없으면 관리자 접속 문자열을 fallback으로 사용한다.
const TEST_DATABASE_URL =
  toTestDatabaseUrl(DEV_DATABASE_URL) || toTestDatabaseUrl(ADMIN_CONNECTION_STRING);

let ensurePromise = null;

async function ensureTestDatabaseImpl() {
  if (!ADMIN_CONNECTION_STRING) {
    throw new Error(
      'backend/.env에 POSTGRES_CONNECTION_STRING이 설정되어 있어야 테스트 DB를 준비할 수 있습니다.'
    );
  }

  const adminClient = new Client({ connectionString: ADMIN_CONNECTION_STRING });
  await adminClient.connect();

  try {
    const appCreds = parseDbUrl(DEV_DATABASE_URL);

    // todolist_app 계정이 아직 없을 수 있으므로 방어적으로 생성 시도(실패는 무시)
    if (appCreds && isValidIdentifier(appCreds.user)) {
      try {
        await adminClient.query(
          `CREATE USER ${quoteIdent(appCreds.user)} WITH PASSWORD '${escapeLiteral(
            appCreds.password || appCreds.user
          )}'`
        );
        console.log(`[db-setup] role "${appCreds.user}" 생성 완료`);
      } catch (err) {
        console.log(`[db-setup] role "${appCreds.user}" 생성 스킵(이미 존재하거나 권한 없음): ${err.message}`);
      }
    }

    const { rowCount } = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DB_NAME]
    );

    if (rowCount > 0) {
      console.log(`[db-setup] database "${TEST_DB_NAME}"가 이미 존재해 생성을 스킵함`);
      return;
    }

    const owner = appCreds && isValidIdentifier(appCreds.user) ? appCreds.user : null;
    const DUPLICATE_DATABASE = '42P04';
    try {
      const ownerClause = owner ? ` OWNER ${quoteIdent(owner)}` : '';
      await adminClient.query(`CREATE DATABASE ${quoteIdent(TEST_DB_NAME)}${ownerClause}`);
      console.log(`[db-setup] database "${TEST_DB_NAME}" 생성 완료${owner ? ` (owner=${owner})` : ''}`);
    } catch (err) {
      if (err.code === DUPLICATE_DATABASE) {
        // node:test가 테스트 파일마다 별도 프로세스를 띄우는 탓에 이 존재 확인 이후 다른
        // 프로세스가 먼저 생성했을 수 있다(check-then-create 레이스). 이미 존재하면 성공으로 간주.
        console.log(`[db-setup] database "${TEST_DB_NAME}"가 동시에 다른 프로세스에서 이미 생성됨 - 스킵`);
        return;
      }
      console.log(`[db-setup] OWNER 지정 CREATE DATABASE 실패(${err.message}), OWNER 없이 재시도`);
      try {
        await adminClient.query(`CREATE DATABASE ${quoteIdent(TEST_DB_NAME)}`);
        console.log(`[db-setup] database "${TEST_DB_NAME}" 생성 완료(기본 owner)`);
      } catch (retryErr) {
        if (retryErr.code === DUPLICATE_DATABASE) {
          console.log(`[db-setup] database "${TEST_DB_NAME}"가 동시에 다른 프로세스에서 이미 생성됨 - 스킵`);
          return;
        }
        throw retryErr;
      }
    }
  } finally {
    await adminClient.end();
  }
}

/**
 * todolist_test DB가 없으면 생성한다(있으면 스킵). 여러 테스트에서 호출해도
 * 프로세스 내에서 한 번만 실제로 수행되도록 memoize한다.
 */
function ensureTestDatabase() {
  if (!ensurePromise) {
    ensurePromise = ensureTestDatabaseImpl().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  return ensurePromise;
}

/**
 * env.js의 fail-fast 분기를 자식 프로세스로 검증할 때 dotenv가 backend/.env를
 * 자동으로 읽어버리는 것을 피하기 위한 격리된 빈 작업 디렉토리를 만든다.
 */
function createEmptyCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'todolist-env-test-'));
}

const { spawnSync } = require('node:child_process');

let migratePromise = null;

async function ensureMigrationsAppliedImpl() {
  await ensureTestDatabase();
  const result = spawnSync('npm', ['run', 'migrate:up'], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    encoding: 'utf8',
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error(
      `[db-setup] migrate:up 실패 (exit=${result.status})\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  }
  console.log('[db-setup] todolist_test에 마이그레이션 적용 완료(멱등, 이미 적용된 경우 no-op)');
}

/**
 * todolist_test DB에 마이그레이션(0001~0003)이 적용되어 있음을 보장한다.
 * migrate:up은 멱등하므로(node-pg-migrate가 pgmigrations 테이블로 적용 여부를 추적) 여러 테스트
 * 파일이 각자 호출해도 안전하며, 파일 실행 순서(migrations.test.js가 down/up을 왕복하는 것 포함)와
 * 무관하게 인덱스/제약조건/시드 검증 테스트가 스키마 존재를 전제할 수 있게 한다.
 */
function ensureMigrationsApplied() {
  if (!migratePromise) {
    migratePromise = ensureMigrationsAppliedImpl().catch((err) => {
      migratePromise = null;
      throw err;
    });
  }
  return migratePromise;
}

module.exports = {
  BACKEND_ROOT,
  ENV_PATH,
  TEST_DB_NAME,
  ADMIN_CONNECTION_STRING,
  DEV_DATABASE_URL,
  TEST_DATABASE_URL,
  ensureTestDatabase,
  ensureMigrationsApplied,
  getEnv,
  createEmptyCwd,
};
