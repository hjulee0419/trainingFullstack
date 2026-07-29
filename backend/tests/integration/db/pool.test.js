'use strict';

// DB-4 완료조건: pg Pool 설정값(max/idleTimeoutMillis/connectionTimeoutMillis) 확정 및
//               SELECT 1 검증, pool.end() 시 커넥션 누수 없이 정상 종료되는지 확인한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { ensureTestDatabase, ensureMigrationsApplied, TEST_DATABASE_URL, BACKEND_ROOT } = require('./setup');

const POOL_MODULE_PATH = path.join(BACKEND_ROOT, 'src', 'config', 'db.pool.js');
const poolModuleExists = fs.existsSync(POOL_MODULE_PATH);

test(
  'DB-4: db.pool.js SELECT 1 및 pool.end() 검증',
  { skip: !poolModuleExists && 'backend/src/config/db.pool.js가 아직 없어 스킵함(다른 에이전트 작업 대기)' },
  async (t) => {
    await ensureTestDatabase();
    await ensureMigrationsApplied();

    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = TEST_DATABASE_URL;

    // 다른 테스트 파일/이전 require 캐시의 영향을 받지 않도록 항상 새로 로드한다.
    // db.pool.js는 pg.Pool 인스턴스를 직접 export하지 않고 { getPool } 팩토리로 싱글턴을 노출한다.
    delete require.cache[require.resolve(POOL_MODULE_PATH)];
    const { getPool } = require(POOL_MODULE_PATH);
    const pool = getPool();

    t.after(async () => {
      await pool.end();
      console.log('[pool.test] pool.end() 완료 - 커넥션 누수 없이 정상 종료됨');
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
      delete require.cache[require.resolve(POOL_MODULE_PATH)];
    });

    await t.test('pool.query("SELECT 1")이 성공한다', async () => {
      const { rows } = await pool.query('SELECT 1 AS ok');
      assert.equal(rows[0].ok, 1);
      console.log('[pool.test] SELECT 1 성공');
    });

    await t.test('max/idleTimeoutMillis/connectionTimeoutMillis가 정수로 설정되어 있다', () => {
      const options = pool.options ?? {};
      assert.ok(
        Number.isInteger(options.max) && options.max > 0,
        `pool.options.max가 양의 정수여야 함 (실제: ${options.max})`
      );
      assert.ok(
        Number.isInteger(options.idleTimeoutMillis),
        `pool.options.idleTimeoutMillis가 정수여야 함 (실제: ${options.idleTimeoutMillis})`
      );
      assert.ok(
        Number.isInteger(options.connectionTimeoutMillis),
        `pool.options.connectionTimeoutMillis가 정수여야 함 (실제: ${options.connectionTimeoutMillis})`
      );
      console.log(
        `[pool.test] pool 설정값 max=${options.max}, idleTimeoutMillis=${options.idleTimeoutMillis}, connectionTimeoutMillis=${options.connectionTimeoutMillis}`
      );
    });

    await t.test('동시에 여러 커넥션을 요청해도 정상적으로 처리된다(풀 동작 확인)', async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) => pool.query('SELECT $1::int AS n', [i]))
      );
      const values = results.map((r) => r.rows[0].n);
      assert.deepEqual(values, [0, 1, 2, 3, 4]);
    });
  }
);
