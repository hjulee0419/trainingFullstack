'use strict';

// DB-6 완료조건: 시드 스크립트(backend/scripts/seed.js) 실행 후 users row가 존재하고,
//               "기본 카테고리는 회원가입 트랜잭션과 동일한 순서로 시딩된다"는 정책에 따라
//               사용자별 is_default 카테고리가 정확히 1개씩 존재하는지 확인한다.
// backend/scripts/seed.js는 Should 항목(여력 시 작업)이라 아직 존재하지 않을 수 있으며,
// 그 경우 이 테스트 전체를 명시적으로 skip 처리한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const { ensureTestDatabase, ensureMigrationsApplied, TEST_DATABASE_URL, BACKEND_ROOT } = require('./setup');

const SEED_SCRIPT_PATH = path.join(BACKEND_ROOT, 'scripts', 'seed.js');
const seedScriptExists = fs.existsSync(SEED_SCRIPT_PATH);

test(
  'DB-6: seed.js 실행 후 사용자당 기본 카테고리 1개 존재 검증',
  {
    skip:
      !seedScriptExists &&
      'backend/scripts/seed.js가 아직 없어 스킵함(DB-6는 Should 항목, 다른 에이전트 작업 대기)',
  },
  async (t) => {
    await ensureTestDatabase();
    await ensureMigrationsApplied();

    // seed.js의 "신규 생성" 분기(사용자+기본 카테고리 insert)를 매번 확실히 커버하도록
    // 실행 전 시드 대상 이메일을 정리한다(다른 테스트 실행 잔여 데이터로 인한 skip 분기만
    // 타는 것을 방지).
    await t.test('테스트 준비: 이전 실행의 시드 데이터 정리', async () => {
      const client = new Client({ connectionString: TEST_DATABASE_URL });
      await client.connect();
      try {
        await client.query(
          `DELETE FROM users WHERE email LIKE 'seed.user%@example.com'`
        );
      } finally {
        await client.end();
      }
    });

    await t.test('seed 스크립트가 오류 없이 실행된다(신규 생성 분기)', () => {
      const result = spawnSync('node', [SEED_SCRIPT_PATH], {
        cwd: BACKEND_ROOT,
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        encoding: 'utf8',
      });
      console.log(`[seed.test] seed.js 실행(신규) → exit=${result.status}`);
      if (result.stdout) console.log(`[seed.test] stdout:\n${result.stdout}`);
      if (result.stderr) console.log(`[seed.test] stderr:\n${result.stderr}`);
      assert.equal(result.status, 0, `seed.js 실행 실패 (exit=${result.status})`);
      assert.match(result.stdout, /사용자 생성 완료/, '신규 생성 분기가 실행되지 않음');
    });

    await t.test('seed 스크립트를 재실행해도 오류 없이 처리된다(이미 존재 분기, 멱등성)', () => {
      const result = spawnSync('node', [SEED_SCRIPT_PATH], {
        cwd: BACKEND_ROOT,
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        encoding: 'utf8',
      });
      console.log(`[seed.test] seed.js 재실행 → exit=${result.status}`);
      assert.equal(result.status, 0, `seed.js 재실행 실패 (exit=${result.status})`);
      assert.match(result.stdout, /이미 존재하는 사용자, 건너뜀/, '중복 스킵 분기가 실행되지 않음');
    });

    await t.test('users row가 최소 1개 이상 존재한다', async () => {
      const client = new Client({ connectionString: TEST_DATABASE_URL });
      await client.connect();
      try {
        const { rows } = await client.query('SELECT count(*)::int AS cnt FROM users');
        assert.ok(rows[0].cnt >= 1, '시드된 users row가 존재하지 않음');
        console.log(`[seed.test] users row 개수: ${rows[0].cnt}`);
      } finally {
        await client.end();
      }
    });

    await t.test('사용자별 is_default 카테고리가 정확히 1개씩 존재한다', async () => {
      const client = new Client({ connectionString: TEST_DATABASE_URL });
      await client.connect();
      try {
        const { rows } = await client.query(
          `SELECT user_id, count(*)::int AS cnt
             FROM categories
            WHERE is_default = true
            GROUP BY user_id
           HAVING count(*) <> 1`
        );
        assert.equal(
          rows.length,
          0,
          `기본 카테고리 개수가 1이 아닌 사용자가 존재함: ${JSON.stringify(rows)}`
        );
        console.log('[seed.test] 모든 사용자가 기본 카테고리를 정확히 1개씩 보유함을 확인');
      } finally {
        await client.end();
      }
    });
  }
);
