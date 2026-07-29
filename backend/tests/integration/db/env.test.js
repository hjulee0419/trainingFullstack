'use strict';

// DB-1/BE-1 연계 검증: src/config/env.js의 fail-fast 분기(필수 환경변수 누락 시
// console.error 로그와 함께 프로세스 종료 또는 예외 발생)를 자식 프로세스로 실행해 커버한다.
// - 정상 케이스: 필수 환경변수(DATABASE_URL 등)가 모두 있으면 정상 로드된다.
// - 실패 케이스: DATABASE_URL이 없으면 정상 종료(exit 0)되지 않아야 한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { BACKEND_ROOT, TEST_DATABASE_URL, createEmptyCwd } = require('./setup');

const ENV_MODULE_PATH = path.join(BACKEND_ROOT, 'src', 'config', 'env.js');
const envModuleExists = fs.existsSync(ENV_MODULE_PATH);

function runEnvModule(cwd, env) {
  return spawnSync(
    'node',
    ['-e', `require(${JSON.stringify(ENV_MODULE_PATH)}); console.log('ENV_LOAD_OK');`],
    { cwd, env, encoding: 'utf8' }
  );
}

test(
  'DB-1: env.js fail-fast 검증(필수 환경변수 누락 시 프로세스 종료)',
  {
    skip:
      !envModuleExists &&
      'backend/src/config/env.js가 아직 없어 스킵함(다른 에이전트 작업 대기)',
  },
  async (t) => {
    await t.test('필수 환경변수(DATABASE_URL 등)가 모두 있으면 정상 로드된다', () => {
      // backend/.env가 아직 모든 필수 값을 갖추지 않았을 수 있으므로,
      // 정상 케이스는 실제 backend 디렉토리에서 실행하되 DATABASE_URL을 명시적으로 주입해
      // "필수 env가 채워진 상태"를 재현한다.
      const result = runEnvModule(BACKEND_ROOT, {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      });
      console.log('[env.test] 정상 케이스 stdout:', result.stdout);
      if (result.stderr) console.log('[env.test] 정상 케이스 stderr:', result.stderr);
      assert.equal(result.status, 0, `env.js가 정상 케이스에서 실패 종료됨 (exit=${result.status})`);
      assert.match(result.stdout, /ENV_LOAD_OK/, 'env.js 로드 후 다음 코드가 실행되지 않음');
    });

    await t.test(
      '필수 환경변수(DATABASE_URL)가 누락되면 프로세스가 실패 종료하거나 예외를 던진다',
      () => {
        // dotenv가 backend/.env를 자동으로 읽어 DATABASE_URL을 채워버리는 것을 피하기 위해
        // .env 파일이 없는 격리된 빈 디렉토리에서 실행한다.
        const emptyCwd = createEmptyCwd();
        t.after(() => {
          fs.rmSync(emptyCwd, { recursive: true, force: true });
        });

        const envWithoutDatabaseUrl = { ...process.env };
        delete envWithoutDatabaseUrl.DATABASE_URL;
        // backend/.env는 DOTENV_PATH를 지정하지 않으면 절대경로로 항상 로드되므로(실제 값이
        // 채워져 있어 fail-fast를 재현할 수 없음), 존재하지 않는 경로로 override해 dotenv가
        // 아무 것도 로드하지 못하는 상태를 만든다.
        envWithoutDatabaseUrl.DOTENV_PATH = path.join(emptyCwd, 'nonexistent.env');

        const result = runEnvModule(emptyCwd, envWithoutDatabaseUrl);
        console.log('[env.test] 누락 케이스 stdout:', result.stdout);
        console.log('[env.test] 누락 케이스 stderr:', result.stderr);

        assert.notEqual(
          result.status,
          0,
          'DATABASE_URL이 없는데도 exit 0으로 종료됨 - fail-fast가 구현되지 않음'
        );
        assert.doesNotMatch(
          result.stdout ?? '',
          /ENV_LOAD_OK/,
          'DATABASE_URL 누락 시에도 env.js 로드 이후 코드가 실행됨'
        );
      }
    );
  }
);
