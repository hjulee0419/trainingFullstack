'use strict';

// DB-5 완료조건: pg_indexes 조회로 todos용 인덱스 3개가 모두 존재하고 각 인덱스의 선행 컬럼이
//               user_id임을 확인하며, docs/6-erd.md의 제약조건 목록과 실제 DB 제약을 대조한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const { ensureTestDatabase, ensureMigrationsApplied, TEST_DATABASE_URL } = require('./setup');

// database/schema.sql / docs/6-erd.md 기준 todos 인덱스 목록(PRD 6.1 FR-5 필터 쿼리 대응)
const EXPECTED_TODOS_INDEXES = [
  'idx_todos_user_id_category_id',
  'idx_todos_user_id_is_completed',
  'idx_todos_user_id_end_date',
];

test('DB-5: pg_indexes/pg_constraint 기반 인덱스·제약조건 검증', async (t) => {
  await ensureTestDatabase();
  await ensureMigrationsApplied();

  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();

  t.after(async () => {
    await client.end();
  });

  await t.test('todos용 인덱스 3개가 모두 존재한다', async () => {
    const { rows } = await client.query(
      `SELECT indexname, indexdef
         FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'todos'`
    );
    const indexNames = rows.map((r) => r.indexname);
    for (const expected of EXPECTED_TODOS_INDEXES) {
      assert.ok(
        indexNames.includes(expected),
        `${expected} 인덱스가 존재하지 않음 (실제: ${indexNames.join(', ')})`
      );
    }
  });

  await t.test('각 인덱스의 선행 컬럼이 user_id이다', async () => {
    const { rows } = await client.query(
      `SELECT indexname, indexdef
         FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'todos'
          AND indexname = ANY($1::text[])`,
      [EXPECTED_TODOS_INDEXES]
    );
    assert.equal(rows.length, EXPECTED_TODOS_INDEXES.length, '기대한 인덱스 개수와 실제 조회 개수가 다름');
    for (const row of rows) {
      assert.match(
        row.indexdef,
        /\(user_id[,)]/,
        `${row.indexname}의 선행 컬럼이 user_id가 아님: ${row.indexdef}`
      );
    }
  });

  await t.test(
    'docs/6-erd.md 제약조건 목록과 대조: users.email UK, categories 유니크 2종, todos CHECK/FK',
    async () => {
      const { rows: userUniques } = await client.query(
        `SELECT conname
           FROM pg_constraint
          WHERE conrelid = 'public.users'::regclass
            AND contype = 'u'`
      );
      assert.ok(
        userUniques.some((r) => r.conname === 'uq_users_email'),
        'ERD 명시된 users.email UNIQUE(uq_users_email)가 존재하지 않음'
      );

      const { rows: categoryUniques } = await client.query(
        `SELECT conname
           FROM pg_constraint
          WHERE conrelid = 'public.categories'::regclass
            AND contype = 'u'`
      );
      assert.ok(
        categoryUniques.some((r) => r.conname === 'uq_categories_user_id_name'),
        'ERD 명시된 categories(user_id, name) UNIQUE가 존재하지 않음'
      );

      const { rows: categoryPartialIndex } = await client.query(
        `SELECT indexname
           FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'categories'
            AND indexname = 'uq_categories_user_id_default'`
      );
      assert.equal(
        categoryPartialIndex.length,
        1,
        'ERD 명시된 사용자당 기본 카테고리 1개 제약(부분 유니크 인덱스)이 존재하지 않음'
      );

      const { rows: todosChecks } = await client.query(
        `SELECT conname, pg_get_constraintdef(oid) AS def
           FROM pg_constraint
          WHERE conrelid = 'public.todos'::regclass
            AND contype = 'c'`
      );
      const endDateCheck = todosChecks.find((r) => r.conname === 'ck_todos_end_date_after_start');
      assert.ok(endDateCheck, 'ERD 명시된 CHECK(end_date >= start_date)가 존재하지 않음');
      assert.match(endDateCheck.def, /end_date\s*>=\s*start_date/);

      const { rows: todosForeignKeys } = await client.query(
        `SELECT conname
           FROM pg_constraint
          WHERE conrelid = 'public.todos'::regclass
            AND contype = 'f'`
      );
      assert.ok(
        todosForeignKeys.length >= 2,
        `ERD 명시된 todos.user_id / todos.category_id FK가 모두 존재해야 함 (실제 개수: ${todosForeignKeys.length})`
      );

      const { rows: categoriesForeignKeys } = await client.query(
        `SELECT conname
           FROM pg_constraint
          WHERE conrelid = 'public.categories'::regclass
            AND contype = 'f'`
      );
      assert.ok(
        categoriesForeignKeys.length >= 1,
        'ERD 명시된 categories.user_id FK가 존재해야 함'
      );
    }
  );
});
