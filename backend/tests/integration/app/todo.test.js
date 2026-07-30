'use strict';

// BE-4(할일 CRUD API) 완료조건(docs/7-execution-plan.md) 통합 검증:
// 1) 등록 성공 시 201 + row 생성
// 2) 카테고리 미지정 시 기본 카테고리 자동 적용 확인
// 3) 종료일자<시작일자 시 400 및 미저장(E-1)
// 4) 수정 시 200 + DB 반영, updated_at 갱신
// 5) 삭제 시 204(또는 200) + row 삭제
// 6) 타 사용자 소유 todo 접근 시 404(FR-10)
// 7) 존재하지 않는 category_id 등록 시 400/404
// (+ 완료 처리/해제 시 completed_at 자동 기록/초기화, 카테고리 지정 등록, 미인증 401)
//
// 개발 DB(todolist_dev)를 오염시키지 않기 위해 todolist_test DB를 사용한다.
// 패턴은 backend/tests/integration/app/category.test.js를 재사용한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { Pool } = require('pg');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', 'src');
const APP_PATH = path.join(SRC_ROOT, 'app.js');
const TODO_ROUTES_PATH = path.join(SRC_ROOT, 'routes', 'todo.routes.js');

const appExists = fs.existsSync(APP_PATH);
const todoRoutesExist = fs.existsSync(TODO_ROUTES_PATH);

let supertest;
try {
  supertest = require('supertest');
} catch (err) {
  supertest = null;
}

const {
  ensureTestDatabase,
  ensureMigrationsApplied,
  TEST_DATABASE_URL,
} = require('../db/setup');

const shouldSkip = !appExists || !todoRoutesExist || !supertest;

if (!appExists) {
  console.log('[todo.test] src/app.js가 아직 존재하지 않아 skip 합니다.');
} else if (!todoRoutesExist) {
  console.log('[todo.test] src/routes/todo.routes.js가 아직 존재하지 않아 skip 합니다.');
} else if (!supertest) {
  console.log('[todo.test] supertest가 설치되어 있지 않아 skip 합니다.');
}

test('src/app.js 또는 BE-4 산출물이 아직 없으면 skip', { skip: !shouldSkip }, () => {
  console.log('[todo.test] 위 사유로 전체 테스트를 skip 합니다.');
});

const EMAIL_PREFIX = 'todo-test-';
const USER_A_EMAIL = `${EMAIL_PREFIX}a@example.com`;
const USER_B_EMAIL = `${EMAIL_PREFIX}b@example.com`;
const PASSWORD = 'password123';

function clearSrcRequireCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC_ROOT)) {
      delete require.cache[key];
    }
  }
}

async function signupAndLogin(app, email) {
  const signupRes = await supertest(app).post('/api/v1/auth/signup').send({
    email,
    password: PASSWORD,
    nickname: '할일테스트',
  });
  assert.equal(signupRes.status, 201, `사전 준비 회원가입 실패: ${JSON.stringify(signupRes.body)}`);

  const loginRes = await supertest(app).post('/api/v1/auth/login').send({
    email,
    password: PASSWORD,
  });
  assert.equal(loginRes.status, 200, `사전 준비 로그인 실패: ${JSON.stringify(loginRes.body)}`);

  return { userId: signupRes.body.id, token: loginRes.body.accessToken };
}

test(
  'BE-4 할일 CRUD API 통합 테스트',
  { skip: shouldSkip },
  async (t) => {
    await ensureTestDatabase();
    await ensureMigrationsApplied();

    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.NODE_ENV = 'test';

    clearSrcRequireCache();

    const pool = new Pool({ connectionString: TEST_DATABASE_URL });
    let app;

    t.after(async () => {
      await pool.end();
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
      clearSrcRequireCache();
    });

    await t.test('사전 정리: 이번 테스트에서 사용할 이메일의 기존 데이터 삭제', async () => {
      // users -> categories/todos는 FK가 ON DELETE CASCADE이므로 users 삭제만으로 함께 정리된다.
      await pool.query('DELETE FROM users WHERE email LIKE $1', [`${EMAIL_PREFIX}%`]);
    });

    app = require(APP_PATH);

    let userA;
    let userB;
    let userADefaultCategoryId;

    await t.test('사전 준비: 사용자 A, B 회원가입 및 로그인', async () => {
      userA = await signupAndLogin(app, USER_A_EMAIL);
      userB = await signupAndLogin(app, USER_B_EMAIL);
      assert.ok(userA.token);
      assert.ok(userB.token);

      const defaultCategoryRows = await pool.query(
        'SELECT id FROM categories WHERE user_id = $1 AND is_default = true',
        [userA.userId]
      );
      assert.equal(defaultCategoryRows.rows.length, 1);
      userADefaultCategoryId = defaultCategoryRows.rows[0].id;
    });

    await t.test('완료조건: 미인증 요청 시 생성 401', async () => {
      const res = await supertest(app).post('/api/v1/todos').send({
        title: '무인증 할일',
        startDate: '2026-08-01',
        endDate: '2026-08-02',
      });
      assert.equal(res.status, 401);
    });

    let createdTodoId;

    await t.test('완료조건 1,2: 카테고리 미지정 등록 시 201 + row 생성 + 기본 카테고리 자동 적용', async () => {
      const res = await supertest(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: '기본카테고리 할일',
          startDate: '2026-08-01',
          endDate: '2026-08-05',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.title, '기본카테고리 할일');
      assert.ok(res.body.id !== undefined && res.body.id !== null);
      assert.equal(String(res.body.categoryId), String(userADefaultCategoryId));

      createdTodoId = res.body.id;

      const rows = await pool.query('SELECT * FROM todos WHERE id = $1', [createdTodoId]);
      assert.equal(rows.rows.length, 1);
      assert.equal(String(rows.rows[0].user_id), String(userA.userId));
      assert.equal(String(rows.rows[0].category_id), String(userADefaultCategoryId));
      assert.equal(rows.rows[0].title, '기본카테고리 할일');
    });

    let customCategoryId;

    await t.test('사전 준비: A의 별도 카테고리 생성', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: '할일용카테고리' });
      assert.equal(res.status, 201);
      customCategoryId = res.body.id;
    });

    await t.test('완료조건 1: 카테고리 지정 등록 시 201 + categoryId/categoryName 응답 일치', async () => {
      const res = await supertest(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: '지정카테고리 할일',
          categoryId: customCategoryId,
          startDate: '2026-08-01',
          endDate: '2026-08-02',
        });

      assert.equal(res.status, 201);
      assert.equal(String(res.body.categoryId), String(customCategoryId));
      assert.equal(res.body.categoryName, '할일용카테고리');

      const rows = await pool.query('SELECT category_id FROM todos WHERE id = $1', [res.body.id]);
      assert.equal(String(rows.rows[0].category_id), String(customCategoryId));
    });

    await t.test('완료조건 3(E-1): 종료일자<시작일자 등록 시도 시 400 및 미저장', async () => {
      const countBefore = await pool.query('SELECT count(*) FROM todos WHERE user_id = $1', [userA.userId]);

      const res = await supertest(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: '날짜오류 할일',
          startDate: '2026-08-10',
          endDate: '2026-08-01',
        });
      assert.equal(res.status, 400);

      const countAfter = await pool.query('SELECT count(*) FROM todos WHERE user_id = $1', [userA.userId]);
      assert.equal(countBefore.rows[0].count, countAfter.rows[0].count);
    });

    await t.test('완료조건 7: 존재하지 않는 categoryId로 등록 시 400/404', async () => {
      const res = await supertest(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: '존재안하는카테고리 할일',
          categoryId: 9999999,
          startDate: '2026-08-01',
          endDate: '2026-08-02',
        });
      assert.ok(
        [400, 404].includes(res.status),
        `존재하지 않는 categoryId는 400 또는 404여야 하는데 ${res.status}`
      );
    });

    let beforeUpdateUpdatedAt;

    await t.test('완료조건 4: 제목만 수정 시 200 + 응답 반영', async () => {
      const beforeRows = await pool.query('SELECT updated_at FROM todos WHERE id = $1', [createdTodoId]);
      beforeUpdateUpdatedAt = beforeRows.rows[0].updated_at;

      // updated_at 비교가 유의미하도록 약간의 시간차를 둔다.
      await new Promise((resolve) => setTimeout(resolve, 20));

      const res = await supertest(app)
        .patch(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ title: '수정된 제목' });

      assert.equal(res.status, 200);
      assert.equal(res.body.title, '수정된 제목');
    });

    await t.test('완료조건 4: updated_at이 수정 전보다 갱신되었는지 확인', async () => {
      const rows = await pool.query('SELECT title, updated_at FROM todos WHERE id = $1', [createdTodoId]);
      assert.equal(rows.rows[0].title, '수정된 제목');
      assert.ok(
        new Date(rows.rows[0].updated_at) > new Date(beforeUpdateUpdatedAt),
        'updated_at이 수정 전보다 최신이어야 한다'
      );
    });

    await t.test('완료조건: 수정 시 종료일자<시작일자면 400', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ startDate: '2026-09-10', endDate: '2026-09-01' });
      assert.equal(res.status, 400);
    });

    await t.test('완료: isCompleted=true로 PATCH 시 200 + completedAt 자동 기록', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ isCompleted: true });

      assert.equal(res.status, 200);
      assert.equal(res.body.isCompleted, true);
      assert.ok(res.body.completedAt, 'completedAt이 기록되어야 한다');
      assert.ok(
        Math.abs(Date.now() - new Date(res.body.completedAt).getTime()) < 10000,
        'completedAt은 현재 시각과 근접해야 한다'
      );
    });

    await t.test('완료 해제: isCompleted=false로 PATCH 시 completedAt이 null로 초기화', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ isCompleted: false });

      assert.equal(res.status, 200);
      assert.equal(res.body.isCompleted, false);
      assert.equal(res.body.completedAt, null);

      const rows = await pool.query('SELECT completed_at FROM todos WHERE id = $1', [createdTodoId]);
      assert.equal(rows.rows[0].completed_at, null);
    });

    await t.test('완료조건 6: B 토큰으로 A의 todo 수정/삭제 시도 시 404', async () => {
      const updateRes = await supertest(app)
        .patch(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ title: '남의 할일 수정' });
      assert.equal(updateRes.status, 404);

      const deleteRes = await supertest(app)
        .delete(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userB.token}`);
      assert.equal(deleteRes.status, 404);

      // 부작용 없어야 함(여전히 A 소유로 존재, 제목 그대로)
      const rows = await pool.query('SELECT title FROM todos WHERE id = $1', [createdTodoId]);
      assert.equal(rows.rows.length, 1);
      assert.equal(rows.rows[0].title, '수정된 제목');
    });

    await t.test('완료조건 5: 삭제 시 204/200 + row 삭제', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      assert.ok([200, 204].includes(res.status));

      const rows = await pool.query('SELECT * FROM todos WHERE id = $1', [createdTodoId]);
      assert.equal(rows.rows.length, 0);
    });

    await t.test('완료조건: 삭제된 todo에 대한 재수정/재삭제 시도 시 404', async () => {
      const updateRes = await supertest(app)
        .patch(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ title: '이미 삭제된 할일' });
      assert.equal(updateRes.status, 404);

      const deleteRes = await supertest(app)
        .delete(`/api/v1/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      assert.equal(deleteRes.status, 404);
    });

    await t.test('완료조건: 존재하지 않는 todoId 수정/삭제 시 404', async () => {
      const nonExistentId = 987654321;

      const updateRes = await supertest(app)
        .patch(`/api/v1/todos/${nonExistentId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ title: '없는 할일' });
      assert.equal(updateRes.status, 404);

      const deleteRes = await supertest(app)
        .delete(`/api/v1/todos/${nonExistentId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      assert.equal(deleteRes.status, 404);
    });

    await t.test('완료조건: 필수값 누락(title 없음) 등록 시 400', async () => {
      const res = await supertest(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          startDate: '2026-08-01',
          endDate: '2026-08-02',
        });
      assert.equal(res.status, 400);
    });
  }
);
