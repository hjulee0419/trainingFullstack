'use strict';

// BE-5(할일 목록 조회 API: 상태파생+필터+페이지네이션) 완료조건(docs/7-execution-plan.md) 통합 검증:
// 1) 본인 소유 todo만 반환 확인
// 2) categoryId+status 동시 지정 시 AND 필터링 정확히 동작
// 3) 완료 처리된 todo는 기한초과와 무관하게 'completed' 반환(E-6)
// 4) 경계값(시작일=오늘 -> 진행중, 종료일=오늘 -> 진행중) 테스트 통과
// 5) 응답에 페이지네이션 메타 포함, limit/page 동작 확인
// 6) 필터 미지정 시 전체 목록(페이지네이션 적용) 반환
//
// 개발 DB(todolist_dev)를 오염시키지 않기 위해 todolist_test DB를 사용한다.
// 패턴은 backend/tests/integration/app/todo.test.js를 재사용한다.

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

// GET '/' (목록조회) 라우트가 실제로 등록되어 있는지 소스 텍스트로 방어적으로 확인한다.
// (BE-5 작업이 진행 중인 동안에는 todo.routes.js는 존재하지만 GET '/'는 없을 수 있다.)
let listRouteRegistered = false;
if (todoRoutesExist) {
  const routesSource = fs.readFileSync(TODO_ROUTES_PATH, 'utf8');
  listRouteRegistered = /\.get\(\s*['"]\/['"]/.test(routesSource);
}

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

const shouldSkip = !appExists || !todoRoutesExist || !listRouteRegistered || !supertest;

if (!appExists) {
  console.log('[todo-list.test] src/app.js가 아직 존재하지 않아 skip 합니다.');
} else if (!todoRoutesExist) {
  console.log('[todo-list.test] src/routes/todo.routes.js가 아직 존재하지 않아 skip 합니다.');
} else if (!listRouteRegistered) {
  console.log('[todo-list.test] GET /api/v1/todos 라우트가 아직 등록되어 있지 않아 skip 합니다.');
} else if (!supertest) {
  console.log('[todo-list.test] supertest가 설치되어 있지 않아 skip 합니다.');
}

test('src/app.js 또는 BE-5 산출물이 아직 없으면 skip', { skip: !shouldSkip }, () => {
  console.log('[todo-list.test] 위 사유로 전체 테스트를 skip 합니다.');
});

const EMAIL_PREFIX = 'todo-list-test-';
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
    nickname: '목록테스트',
  });
  assert.equal(signupRes.status, 201, `사전 준비 회원가입 실패: ${JSON.stringify(signupRes.body)}`);

  const loginRes = await supertest(app).post('/api/v1/auth/login').send({
    email,
    password: PASSWORD,
  });
  assert.equal(loginRes.status, 200, `사전 준비 로그인 실패: ${JSON.stringify(loginRes.body)}`);

  return { userId: signupRes.body.id, token: loginRes.body.accessToken };
}

async function createTodo(app, token, overrides) {
  const res = await supertest(app)
    .post('/api/v1/todos')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: '목록테스트 할일',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      ...overrides,
    });
  assert.equal(res.status, 201, `사전 준비 todo 생성 실패: ${JSON.stringify(res.body)}`);
  return res.body;
}

// 실제 시스템 오늘 날짜 기준 상대 날짜를 YYYY-MM-DD 문자열로 계산하는 헬퍼.
// (overdue/not_started/in_progress 재현을 위해 실제 오늘 날짜를 기준으로 삼아야 한다.)
function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function daysFromToday(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return toDateString(date);
}

test(
  'BE-5 할일 목록 조회 API(상태파생+필터+페이지네이션) 통합 테스트',
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
    let categoryOne;
    let categoryTwo;

    const todos = {};

    await t.test('사전 준비: 사용자 A, B 회원가입 및 로그인', async () => {
      userA = await signupAndLogin(app, USER_A_EMAIL);
      userB = await signupAndLogin(app, USER_B_EMAIL);
      assert.ok(userA.token);
      assert.ok(userB.token);
    });

    await t.test('사전 준비: A의 카테고리1, 카테고리2 생성', async () => {
      const res1 = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: '목록카테고리1' });
      assert.equal(res1.status, 201);
      categoryOne = res1.body.id;

      const res2 = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: '목록카테고리2' });
      assert.equal(res2.status, 201);
      categoryTwo = res2.body.id;
    });

    await t.test('사전 준비: A의 todo들 생성(진행중/기한초과/시작전/완료/경계값)', async () => {
      // 카테고리1, 미완료, 어제~내일 -> in_progress
      todos.inProgressCat1 = await createTodo(app, userA.token, {
        title: '진행중(카테고리1)',
        categoryId: categoryOne,
        startDate: daysFromToday(-1),
        endDate: daysFromToday(1),
      });

      // 카테고리1, 미완료, endDate가 과거 -> overdue
      todos.overdueCat1 = await createTodo(app, userA.token, {
        title: '기한초과(카테고리1)',
        categoryId: categoryOne,
        startDate: daysFromToday(-10),
        endDate: daysFromToday(-5),
      });

      // 카테고리2, 미완료, startDate가 미래 -> not_started
      todos.notStartedCat2 = await createTodo(app, userA.token, {
        title: '시작전(카테고리2)',
        categoryId: categoryTwo,
        startDate: daysFromToday(5),
        endDate: daysFromToday(10),
      });

      // 완료 처리 + endDate가 과거 -> completed(E-6, 기한초과와 무관)
      const completedCandidate = await createTodo(app, userA.token, {
        title: '완료(기한초과무관)',
        categoryId: categoryOne,
        startDate: daysFromToday(-20),
        endDate: daysFromToday(-15),
      });
      const completedRes = await supertest(app)
        .patch(`/api/v1/todos/${completedCandidate.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ isCompleted: true });
      assert.equal(completedRes.status, 200);
      todos.completed = completedRes.body;

      // startDate === 오늘 -> in_progress(경계값)
      todos.boundaryStartToday = await createTodo(app, userA.token, {
        title: '경계값(시작일=오늘)',
        categoryId: categoryTwo,
        startDate: daysFromToday(0),
        endDate: daysFromToday(3),
      });

      // endDate === 오늘 -> in_progress(경계값)
      todos.boundaryEndToday = await createTodo(app, userA.token, {
        title: '경계값(종료일=오늘)',
        categoryId: categoryTwo,
        startDate: daysFromToday(-3),
        endDate: daysFromToday(0),
      });
    });

    let userBTodo;

    await t.test('사전 준비: B의 todo 1개 생성', async () => {
      userBTodo = await createTodo(app, userB.token, {
        title: 'B의 할일',
        startDate: daysFromToday(-1),
        endDate: daysFromToday(1),
      });
    });

    await t.test('완료조건 1: A 토큰으로 필터 없이 조회 시 A 소유 todo만 반환하고 pagination 필드 존재', async () => {
      const res = await supertest(app)
        .get('/api/v1/todos')
        .set('Authorization', `Bearer ${userA.token}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
      assert.ok(res.body.pagination);
      assert.ok('page' in res.body.pagination);
      assert.ok('limit' in res.body.pagination);
      assert.ok('totalCount' in res.body.pagination);
      assert.ok('totalPages' in res.body.pagination);

      const bTodoIncluded = res.body.items.some((item) => String(item.id) === String(userBTodo.id));
      assert.equal(bTodoIncluded, false, 'A의 목록에 B의 todo가 포함되면 안 된다');
    });

    await t.test('완료조건 2: categoryId+status 동시 지정 시 AND 필터링 정확히 동작', async () => {
      const res = await supertest(app)
        .get('/api/v1/todos')
        .query({ categoryId: categoryOne, status: 'in_progress', limit: 100 })
        .set('Authorization', `Bearer ${userA.token}`);

      assert.equal(res.status, 200);

      const ids = res.body.items.map((item) => String(item.id));
      assert.ok(ids.includes(String(todos.inProgressCat1.id)), '카테고리1+in_progress 조건에 맞는 todo가 포함되어야 한다');
      assert.equal(
        ids.includes(String(todos.overdueCat1.id)),
        false,
        '카테고리1이지만 overdue인 todo는 제외되어야 한다'
      );
      assert.equal(
        ids.includes(String(todos.notStartedCat2.id)),
        false,
        'in_progress이지만 카테고리2인 todo는 제외되어야 한다'
      );

      for (const item of res.body.items) {
        assert.equal(String(item.categoryId), String(categoryOne));
        assert.equal(item.status, 'in_progress');
      }
    });

    await t.test('완료조건 3(E-6): 완료 처리된 todo는 기한초과와 무관하게 completed로 반환', async () => {
      const res = await supertest(app)
        .get('/api/v1/todos')
        .query({ limit: 100 })
        .set('Authorization', `Bearer ${userA.token}`);

      assert.equal(res.status, 200);
      const found = res.body.items.find((item) => String(item.id) === String(todos.completed.id));
      assert.ok(found, '완료 처리된 todo가 목록에 있어야 한다');
      assert.equal(found.status, 'completed');
      // BE-8 완료조건: 목록 응답에 completedAt 포함
      assert.ok('completedAt' in found, '목록 응답에 completedAt 키가 포함되어야 한다');
      assert.ok(found.completedAt, '완료 처리된 todo는 completedAt이 채워져 있어야 한다');
    });

    await t.test('완료조건 4: 경계값(시작일=오늘, 종료일=오늘) todo는 모두 in_progress로 반환', async () => {
      const res = await supertest(app)
        .get('/api/v1/todos')
        .query({ limit: 100 })
        .set('Authorization', `Bearer ${userA.token}`);

      assert.equal(res.status, 200);

      const startToday = res.body.items.find(
        (item) => String(item.id) === String(todos.boundaryStartToday.id)
      );
      const endToday = res.body.items.find(
        (item) => String(item.id) === String(todos.boundaryEndToday.id)
      );

      assert.ok(startToday, '시작일=오늘 todo가 목록에 있어야 한다');
      assert.ok(endToday, '종료일=오늘 todo가 목록에 있어야 한다');
      assert.equal(startToday.status, 'in_progress');
      assert.equal(endToday.status, 'in_progress');
    });

    await t.test('완료조건 5,6: limit/page 동작 및 페이지네이션 메타 정확성(필터 없이 전체 목록)', async () => {
      const allRes = await supertest(app)
        .get('/api/v1/todos')
        .query({ limit: 100 })
        .set('Authorization', `Bearer ${userA.token}`);
      assert.equal(allRes.status, 200);
      const totalCount = allRes.body.pagination.totalCount;
      assert.equal(totalCount, 6, 'A가 생성한 todo 총 개수는 6개여야 한다');

      const page1Res = await supertest(app)
        .get('/api/v1/todos')
        .query({ limit: 1, page: 1 })
        .set('Authorization', `Bearer ${userA.token}`);
      const page2Res = await supertest(app)
        .get('/api/v1/todos')
        .query({ limit: 1, page: 2 })
        .set('Authorization', `Bearer ${userA.token}`);

      assert.equal(page1Res.status, 200);
      assert.equal(page2Res.status, 200);
      assert.equal(page1Res.body.items.length, 1);
      assert.equal(page2Res.body.items.length, 1);
      assert.notEqual(
        String(page1Res.body.items[0].id),
        String(page2Res.body.items[0].id),
        'page=1과 page=2는 서로 다른 항목을 반환해야 한다'
      );

      assert.equal(page1Res.body.pagination.totalCount, totalCount);
      assert.equal(
        page1Res.body.pagination.totalPages,
        Math.ceil(totalCount / 1),
        'totalPages는 Math.ceil(totalCount/limit)이어야 한다'
      );
    });

    await t.test('완료조건 6: 필터 미지정 시 기본 limit=20으로 전체 목록(페이지네이션 적용) 반환', async () => {
      const res = await supertest(app)
        .get('/api/v1/todos')
        .set('Authorization', `Bearer ${userA.token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.pagination.page, 1);
      assert.equal(res.body.pagination.limit, 20);
      assert.equal(res.body.pagination.totalCount, 6);
      assert.equal(res.body.items.length, 6);
    });

    await t.test('완료조건 1: B 토큰으로 조회 시 B의 todo만 반환(A 것 미포함)', async () => {
      const res = await supertest(app)
        .get('/api/v1/todos')
        .set('Authorization', `Bearer ${userB.token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.items.length, 1);
      assert.equal(String(res.body.items[0].id), String(userBTodo.id));
    });

    await t.test('완료조건: 미인증 요청 시 401', async () => {
      const res = await supertest(app).get('/api/v1/todos');
      assert.equal(res.status, 401);
    });
  }
);
