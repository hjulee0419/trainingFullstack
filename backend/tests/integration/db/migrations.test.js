'use strict';

// DB-2 완료조건: migrate:up/migrate:down이 오류 없이 실행되고(빈 상태 포함) 러너 관리 테이블이 생성됨.
// DB-3 완료조건: migrations/000x_create_*.sql 적용 후 users/categories/todos 3테이블,
//               ck_todos_end_date_after_start CHECK, todos 인덱스 3개,
//               uq_categories_user_id_name / uq_categories_user_id_default(부분 유니크) / uq_users_email 존재,
//               migrate:down → migrate:up 왕복 성공을 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const { ensureTestDatabase, TEST_DATABASE_URL, BACKEND_ROOT } = require('./setup');

function runNpmScript(scriptName) {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: BACKEND_ROOT,
    env,
    encoding: 'utf8',
    shell: true,
  });
  console.log(`[migrations.test] npm run ${scriptName} → exit=${result.status}`);
  if (result.stdout) console.log(`[migrations.test] stdout:\n${result.stdout}`);
  if (result.stderr) console.log(`[migrations.test] stderr:\n${result.stderr}`);
  return result;
}

async function withClient(fn) {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

test('DB-2/DB-3: migrate:down → migrate:up 왕복 및 스키마 적용 검증', async (t) => {
  await ensureTestDatabase();

  await t.test('migrate:down은 빈 상태를 포함해 오류 없이 실행된다', () => {
    const result = runNpmScript('migrate:down');
    assert.equal(result.status, 0, `migrate:down 실패 (exit=${result.status})`);
  });

  await t.test('migrate:up 실행 후 users/categories/todos 테이블이 생성된다', async () => {
    const upResult = runNpmScript('migrate:up');
    assert.equal(upResult.status, 0, `migrate:up 실패 (exit=${upResult.status})`);

    await withClient(async (client) => {
      const { rows } = await client.query(
        `SELECT table_name
           FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('users', 'categories', 'todos')
          ORDER BY table_name`
      );
      const tableNames = rows.map((r) => r.table_name);
      assert.deepEqual(
        tableNames,
        ['categories', 'todos', 'users'],
        `users/categories/todos 3테이블이 모두 존재해야 함 (실제: ${tableNames.join(', ')})`
      );
    });
  });

  await t.test('마이그레이션 러너의 자체 관리 테이블(pgmigrations 등)이 생성된다', async () => {
    await withClient(async (client) => {
      const { rows } = await client.query(
        `SELECT table_name
           FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name ILIKE '%pgmigrations%'`
      );
      assert.ok(rows.length > 0, 'node-pg-migrate의 자체 관리 테이블(pgmigrations)을 찾을 수 없음');
    });
  });

  await t.test('todos에 3개 인덱스가 존재한다', async () => {
    await withClient(async (client) => {
      const { rows } = await client.query(
        `SELECT indexname
           FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'todos'
            AND indexname LIKE 'idx_todos_%'`
      );
      assert.equal(
        rows.length,
        3,
        `todos 인덱스 3개를 기대했으나 실제 ${rows.length}개: ${rows.map((r) => r.indexname).join(', ')}`
      );
    });
  });

  await t.test('ck_todos_end_date_after_start CHECK 제약이 존재한다', async () => {
    await withClient(async (client) => {
      const { rows } = await client.query(
        `SELECT conname, pg_get_constraintdef(oid) AS def
           FROM pg_constraint
          WHERE conrelid = 'public.todos'::regclass
            AND contype = 'c'`
      );
      const found = rows.find((r) => r.conname === 'ck_todos_end_date_after_start');
      assert.ok(found, 'ck_todos_end_date_after_start CHECK 제약을 찾을 수 없음');
      assert.match(found.def, /end_date\s*>=\s*start_date/);
    });
  });

  await t.test(
    'uq_users_email / uq_categories_user_id_name / uq_categories_user_id_default(부분 유니크)가 존재한다',
    async () => {
      await withClient(async (client) => {
        const { rows: userUniques } = await client.query(
          `SELECT conname
             FROM pg_constraint
            WHERE conrelid = 'public.users'::regclass
              AND contype = 'u'`
        );
        assert.ok(
          userUniques.some((r) => r.conname === 'uq_users_email'),
          'uq_users_email UNIQUE 제약을 찾을 수 없음'
        );

        const { rows: categoryUniques } = await client.query(
          `SELECT conname
             FROM pg_constraint
            WHERE conrelid = 'public.categories'::regclass
              AND contype = 'u'`
        );
        assert.ok(
          categoryUniques.some((r) => r.conname === 'uq_categories_user_id_name'),
          'uq_categories_user_id_name UNIQUE 제약을 찾을 수 없음'
        );

        const { rows: partialIndex } = await client.query(
          `SELECT indexname, indexdef
             FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = 'categories'
              AND indexname = 'uq_categories_user_id_default'`
        );
        assert.equal(
          partialIndex.length,
          1,
          'uq_categories_user_id_default 부분 유니크 인덱스를 찾을 수 없음'
        );
        assert.match(partialIndex[0].indexdef, /UNIQUE/i);
        assert.match(partialIndex[0].indexdef, /WHERE/i);
      });
    }
  );

  await t.test('migrate:down → migrate:up 재실행이 오류 없이 성공한다(왕복 검증)', () => {
    const downResult = runNpmScript('migrate:down');
    assert.equal(downResult.status, 0, `재실행 migrate:down 실패 (exit=${downResult.status})`);

    const upResult = runNpmScript('migrate:up');
    assert.equal(upResult.status, 0, `재실행 migrate:up 실패 (exit=${upResult.status})`);
  });
});
