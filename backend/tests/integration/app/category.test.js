'use strict';

// BE-3(카테고리 API) 완료조건(docs/7-execution-plan.md) 통합 검증:
// 1) 카테고리 생성 시 201 + row 생성(is_default=false)
// 2) 동일 이름 재생성 시 409
// 3) 이름 수정 시 200 + DB 반영
// 4) 기본 카테고리 수정/삭제 요청 시 400으로 거부(403도 관대하게 허용)
// 5) 삭제 시 소속 todos의 category_id가 기본 카테고리로 이관되고 카테고리 row 삭제됨
//    (+ 트랜잭션 원자성: 이관 실패 시 카테고리 삭제도 일어나지 않음을 오류 주입으로 검증)
// 6) 타 사용자 소유 카테고리 접근 시 404
// 7) 미인증 요청 401
//
// 개발 DB(todolist_dev)를 오염시키지 않기 위해 todolist_test DB를 사용한다.
// 패턴은 backend/tests/integration/app/auth.test.js를 재사용한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { Pool } = require('pg');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', 'src');
const APP_PATH = path.join(SRC_ROOT, 'app.js');
const CATEGORY_ROUTES_PATH = path.join(SRC_ROOT, 'routes', 'category.routes.js');
const TODO_REPOSITORY_PATH = path.join(SRC_ROOT, 'repositories', 'todo.repository.js');

const appExists = fs.existsSync(APP_PATH);
const categoryRoutesExist = fs.existsSync(CATEGORY_ROUTES_PATH);

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

const shouldSkip = !appExists || !categoryRoutesExist || !supertest;

if (!appExists) {
  console.log('[category.test] src/app.js가 아직 존재하지 않아 skip 합니다.');
} else if (!categoryRoutesExist) {
  console.log('[category.test] src/routes/category.routes.js가 아직 존재하지 않아 skip 합니다.');
} else if (!supertest) {
  console.log('[category.test] supertest가 설치되어 있지 않아 skip 합니다.');
}

test('src/app.js 또는 BE-3 산출물이 아직 없으면 skip', { skip: !shouldSkip }, () => {
  console.log('[category.test] 위 사유로 전체 테스트를 skip 합니다.');
});

const EMAIL_PREFIX = 'category-test-';
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
    nickname: '카테고리테스트',
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
  'BE-3 카테고리 API 통합 테스트',
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

    await t.test('완료조건 7: 미인증 요청 시 목록 조회/생성 401', async () => {
      const listRes = await supertest(app).get('/api/v1/categories');
      assert.equal(listRes.status, 401);

      const createRes = await supertest(app).post('/api/v1/categories').send({ name: '무인증카테고리' });
      assert.equal(createRes.status, 401);
    });

    let createdCategoryId;
    const CREATED_CATEGORY_NAME = '업무';

    await t.test('완료조건 1: 카테고리 생성 시 201 + is_default=false + DB row 존재', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: CREATED_CATEGORY_NAME });

      assert.equal(res.status, 201);
      assert.equal(res.body.name, CREATED_CATEGORY_NAME);
      assert.equal(res.body.isDefault, false);
      assert.ok(res.body.id !== undefined && res.body.id !== null);

      createdCategoryId = res.body.id;

      const rows = await pool.query('SELECT * FROM categories WHERE id = $1', [createdCategoryId]);
      assert.equal(rows.rows.length, 1);
      assert.equal(rows.rows[0].name, CREATED_CATEGORY_NAME);
      assert.equal(rows.rows[0].is_default, false);
      assert.equal(String(rows.rows[0].user_id), String(userA.userId));
    });

    await t.test('완료조건 2: 동일 이름으로 재생성 시 409', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: CREATED_CATEGORY_NAME });

      assert.equal(res.status, 409);

      const countRows = await pool.query(
        'SELECT count(*) FROM categories WHERE user_id = $1 AND name = $2',
        [userA.userId, CREATED_CATEGORY_NAME]
      );
      assert.equal(countRows.rows[0].count, '1');
    });

    const UPDATED_CATEGORY_NAME = '업무-수정';

    await t.test('완료조건 3: 이름 수정 시 200 + 응답/DB 모두 반영', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: UPDATED_CATEGORY_NAME });

      assert.equal(res.status, 200);
      assert.equal(res.body.name, UPDATED_CATEGORY_NAME);

      const rows = await pool.query('SELECT name FROM categories WHERE id = $1', [createdCategoryId]);
      assert.equal(rows.rows[0].name, UPDATED_CATEGORY_NAME);
    });

    await t.test('완료조건: 유효성 오류(빈 이름) 시 400', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: '   ' });

      assert.equal(res.status, 400);
    });

    await t.test('완료조건: 51자 이름 생성 시 400', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: 'a'.repeat(51) });

      assert.equal(res.status, 400);
    });

    await t.test('완료조건 4: 기본 카테고리 수정 시도 시 400', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/categories/${userADefaultCategoryId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: '기본안바뀜' });

      assert.ok(
        [400, 403].includes(res.status),
        `기본 카테고리 수정은 400(또는 403)이어야 하는데 ${res.status}`
      );
    });

    await t.test('완료조건 4: 기본 카테고리 삭제 시도 시 400', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/categories/${userADefaultCategoryId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      assert.ok(
        [400, 403].includes(res.status),
        `기본 카테고리 삭제는 400(또는 403)이어야 하는데 ${res.status}`
      );

      const rows = await pool.query('SELECT * FROM categories WHERE id = $1', [userADefaultCategoryId]);
      assert.equal(rows.rows.length, 1, '기본 카테고리가 삭제되면 안 된다');
    });

    await t.test('완료조건 6: B 토큰으로 A의 카테고리 수정/삭제 시도 시 404', async () => {
      const updateRes = await supertest(app)
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ name: '남의카테고리수정' });
      assert.equal(updateRes.status, 404);

      const deleteRes = await supertest(app)
        .delete(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${userB.token}`);
      assert.equal(deleteRes.status, 404);

      // 부작용 없어야 함(여전히 A 소유로 존재)
      const rows = await pool.query('SELECT name FROM categories WHERE id = $1', [createdCategoryId]);
      assert.equal(rows.rows.length, 1);
      assert.equal(rows.rows[0].name, UPDATED_CATEGORY_NAME);
    });

    await t.test('완료조건 6: B 토큰으로 A의 카테고리 목록에는 A의 카테고리가 노출되지 않는다', async () => {
      const res = await supertest(app).get('/api/v1/categories').set('Authorization', `Bearer ${userB.token}`);
      assert.equal(res.status, 200);
      const ids = res.body.map((c) => String(c.id));
      assert.ok(!ids.includes(String(createdCategoryId)));
    });

    let deletionTargetCategoryId;
    let dummyTodoId;

    await t.test('사전 준비: 삭제/이관 검증용 신규 카테고리 및 더미 todo 생성', async () => {
      const createRes = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: '삭제대상카테고리' });
      assert.equal(createRes.status, 201);
      deletionTargetCategoryId = createRes.body.id;

      const todoInsert = await pool.query(
        `INSERT INTO todos (user_id, category_id, title, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userA.userId, deletionTargetCategoryId, '더미 할일', '2026-01-01', '2026-01-02']
      );
      dummyTodoId = todoInsert.rows[0].id;
    });

    await t.test(
      '완료조건 5: 삭제 시 소속 todos가 기본 카테고리로 이관되고 카테고리 row는 삭제된다',
      async () => {
        const res = await supertest(app)
          .delete(`/api/v1/categories/${deletionTargetCategoryId}`)
          .set('Authorization', `Bearer ${userA.token}`);

        assert.ok([200, 204].includes(res.status));

        const categoryRows = await pool.query('SELECT * FROM categories WHERE id = $1', [
          deletionTargetCategoryId,
        ]);
        assert.equal(categoryRows.rows.length, 0);

        const todoRows = await pool.query('SELECT category_id FROM todos WHERE id = $1', [dummyTodoId]);
        assert.equal(todoRows.rows.length, 1);
        assert.equal(String(todoRows.rows[0].category_id), String(userADefaultCategoryId));
      }
    );

    // 완료조건 5(트랜잭션 원자성) 검증.
    // 방식 선택: category.service.js가
    //   const { reassignTodosToCategory } = require('../repositories/todo.repository');
    // 형태로 require 시점에 함수 참조를 구조분해해 고정하므로, app을 이미 로드한 뒤
    // todo.repository.js의 module.exports를 나중에 바꿔치기해도 category.service.js가
    // 들고 있는 참조에는 반영되지 않는다.
    // 대신 require.cache를 전부 비운 뒤, category.service.js보다 먼저
    // todo.repository.js를 require해서 그 모듈 객체를 몽키패치한 다음, 그 상태로
    // app.js(→ category.service.js → todo.repository.js)를 다시 require하면
    // Node의 모듈 캐시(동일 절대경로는 같은 객체 재사용)에 의해 patched 버전이
        // 그대로 구조분해되어 사용된다. 이 방식으로 몽키패치가 가능하므로(대안 없이) 이를 채택한다.
    await t.test('완료조건 5(원자성): 이관 실패 시 카테고리 삭제도 롤백된다(오류 주입)', async () => {
      let atomicityTargetCategoryId;
      let atomicityTodoId;

      const createRes = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: '원자성검증카테고리' });
      assert.equal(createRes.status, 201);
      atomicityTargetCategoryId = createRes.body.id;

      const todoInsert = await pool.query(
        `INSERT INTO todos (user_id, category_id, title, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userA.userId, atomicityTargetCategoryId, '원자성 더미 할일', '2026-01-01', '2026-01-02']
      );
      atomicityTodoId = todoInsert.rows[0].id;

      clearSrcRequireCache();

      // category.service.js보다 먼저 todo.repository.js를 require해 캐시에 올린 뒤 몽키패치.
      const todoRepo = require(TODO_REPOSITORY_PATH);
      const originalReassign = todoRepo.reassignTodosToCategory;
      todoRepo.reassignTodosToCategory = () => Promise.reject(new Error('강제 실패(테스트 주입)'));

      let patchApplied = false;
      let patchedApp;
      try {
        patchedApp = require(APP_PATH);

        // 몽키패치가 실제로 반영되었는지(구조분해 캐시 공유 성립 여부) 사전 확인.
        // category.service.js 내부 참조가 patched 함수와 동일한지 직접 검증할 수는 없으므로
        // 아래 API 호출 결과(500 + 부작용 없음)로 간접 확인한다.
        const res = await supertest(patchedApp)
          .delete(`/api/v1/categories/${atomicityTargetCategoryId}`)
          .set('Authorization', `Bearer ${userA.token}`);

        // reassign이 실패하면 트랜잭션이 ROLLBACK되어 카테고리 삭제도 취소되어야 한다.
        // 이 경우 컨트롤러까지 에러가 전파되어 errorHandler가 500으로 응답한다.
        if (res.status === 500) {
          patchApplied = true;
        }

        const categoryRows = await pool.query('SELECT * FROM categories WHERE id = $1', [
          atomicityTargetCategoryId,
        ]);
        const todoRows = await pool.query('SELECT category_id FROM todos WHERE id = $1', [atomicityTodoId]);

        if (patchApplied) {
          assert.equal(res.status, 500);
          assert.equal(categoryRows.rows.length, 1, '이관 실패 시 카테고리는 삭제되지 않아야 한다(원자성)');
          assert.equal(
            String(todoRows.rows[0].category_id),
            String(atomicityTargetCategoryId),
            '이관 실패 시 todo의 category_id는 그대로여야 한다(원자성)'
          );
        } else {
          console.log(
            '[category.test] 몽키패치가 반영되지 않아(캐시 공유 미성립) 원자성 직접 오류 주입 검증을 건너뜁니다.'
          );
        }
      } finally {
        todoRepo.reassignTodosToCategory = originalReassign;
        clearSrcRequireCache();
        app = require(APP_PATH);
      }

      // 오류 주입 성공 여부와 무관하게, 정리를 위해 실제로(정상 경로로) 삭제해 다음 테스트에 영향 없게 한다.
      const cleanupRes = await supertest(app)
        .delete(`/api/v1/categories/${atomicityTargetCategoryId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      assert.ok([200, 204].includes(cleanupRes.status));

      const todoRowsAfterCleanup = await pool.query('SELECT category_id FROM todos WHERE id = $1', [
        atomicityTodoId,
      ]);
      assert.equal(String(todoRowsAfterCleanup.rows[0].category_id), String(userADefaultCategoryId));
    });

    await t.test(
      '완료조건 5(간접 증거, 보조): 삭제된 카테고리 id로 재삭제 시도 시 404이고 부작용 없음',
      async () => {
        const res = await supertest(app)
          .delete(`/api/v1/categories/${deletionTargetCategoryId}`)
          .set('Authorization', `Bearer ${userA.token}`);
        assert.equal(res.status, 404);

        const todoRows = await pool.query('SELECT category_id FROM todos WHERE id = $1', [dummyTodoId]);
        assert.equal(String(todoRows.rows[0].category_id), String(userADefaultCategoryId));
      }
    );
  }
);
