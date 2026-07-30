'use strict';

// BE-7(계정 정보 수정 API) 완료조건(docs/7-execution-plan.md) 통합 검증:
// 1) 닉네임 변경 시 200 + DB 반영
// 2) 비밀번호 최소 길이(8자) 미달 시 400
// 3) 비밀번호 변경 후에는 신규 비밀번호로만 재로그인 성공(기존 비밀번호는 401)
// 4) 미인증 요청 시 401
// (+ BE-2에서 이연된 "정상 JWT로 req.user.id 주입" 완료조건의 최종 검증:
//    GET /users/me가 토큰 소유자 본인의 정보만 정확히 반환하는지 재확인)
//
// 개발 DB(todolist_dev)를 오염시키지 않기 위해 todolist_test DB를 사용한다.
// 패턴은 backend/tests/integration/app/todo.test.js, category.test.js를 재사용한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { Pool } = require('pg');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', 'src');
const APP_PATH = path.join(SRC_ROOT, 'app.js');
const USER_ROUTES_PATH = path.join(SRC_ROOT, 'routes', 'user.routes.js');

const appExists = fs.existsSync(APP_PATH);
const userRoutesExist = fs.existsSync(USER_ROUTES_PATH);

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

const shouldSkip = !appExists || !userRoutesExist || !supertest;

if (!appExists) {
  console.log('[user.test] src/app.js가 아직 존재하지 않아 skip 합니다.');
} else if (!userRoutesExist) {
  console.log('[user.test] src/routes/user.routes.js가 아직 존재하지 않아 skip 합니다.');
} else if (!supertest) {
  console.log('[user.test] supertest가 설치되어 있지 않아 skip 합니다.');
}

test('src/app.js 또는 BE-7 산출물이 아직 없으면 skip', { skip: !shouldSkip }, () => {
  console.log('[user.test] 위 사유로 전체 테스트를 skip 합니다.');
});

const EMAIL_PREFIX = 'user-test-';
const USER_EMAIL = `${EMAIL_PREFIX}main@example.com`;
const PASSWORD = 'password123';
const NICKNAME = '유저테스트닉네임';

function clearSrcRequireCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC_ROOT)) {
      delete require.cache[key];
    }
  }
}

async function signupAndLogin(app, email, password, nickname) {
  const signupRes = await supertest(app).post('/api/v1/auth/signup').send({
    email,
    password,
    nickname,
  });
  assert.equal(signupRes.status, 201, `사전 준비 회원가입 실패: ${JSON.stringify(signupRes.body)}`);

  const loginRes = await supertest(app).post('/api/v1/auth/login').send({
    email,
    password,
  });
  assert.equal(loginRes.status, 200, `사전 준비 로그인 실패: ${JSON.stringify(loginRes.body)}`);

  return { userId: signupRes.body.id, token: loginRes.body.accessToken };
}

test(
  'BE-7 계정 정보 수정 API 통합 테스트',
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

    let user;

    await t.test('사전 준비: 테스트용 사용자 회원가입 및 로그인', async () => {
      user = await signupAndLogin(app, USER_EMAIL, PASSWORD, NICKNAME);
      assert.ok(user.token);
    });

    await t.test('완료조건 4: 미인증 요청 시 조회/수정 401', async () => {
      const getRes = await supertest(app).get('/api/v1/users/me');
      assert.equal(getRes.status, 401);

      const patchRes = await supertest(app)
        .patch('/api/v1/users/me')
        .send({ nickname: '무인증닉네임' });
      assert.equal(patchRes.status, 401);
    });

    await t.test(
      // BE-2에서 이연된 "정상 JWT로 req.user.id 주입" 완료조건의 최종 검증:
      // 이 요청이 토큰 소유자 본인의 정보만 정확히 반환하는지 확인한다.
      '완료조건(BE-2 이연 검증): GET /users/me는 200 + 가입 시 값과 일치하는 본인 정보만 반환',
      async () => {
        const res = await supertest(app)
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${user.token}`);

        assert.equal(res.status, 200);
        assert.equal(String(res.body.id), String(user.userId));
        assert.equal(res.body.email, USER_EMAIL);
        assert.equal(res.body.nickname, NICKNAME);
        assert.equal(res.body.password, undefined);
        assert.equal(res.body.passwordHash, undefined);
      }
    );

    const NEW_NICKNAME = '변경된닉네임';

    await t.test('완료조건 1: 닉네임 변경 시 200 + 응답/DB 모두 반영', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ nickname: NEW_NICKNAME });

      assert.equal(res.status, 200);
      assert.equal(res.body.nickname, NEW_NICKNAME);
      assert.equal(res.body.password, undefined);
      assert.equal(res.body.passwordHash, undefined);

      const rows = await pool.query('SELECT nickname FROM users WHERE id = $1', [user.userId]);
      assert.equal(rows.rows.length, 1);
      assert.equal(rows.rows[0].nickname, NEW_NICKNAME);
    });

    await t.test('완료조건 2: 비밀번호 7자(최소 8자 미만)로 변경 시도 시 400', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ password: '1234567' });

      assert.equal(res.status, 400);
    });

    await t.test('완료조건(정책): nickname/password 둘 다 없는 빈 객체 요청 시 400', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${user.token}`)
        .send({});

      assert.equal(res.status, 400);
    });

    const NEW_PASSWORD = 'NewPassw0rd!';

    await t.test('완료조건 3: 비밀번호를 8자 이상으로 변경 시 200', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ password: NEW_PASSWORD });

      assert.equal(res.status, 200);
    });

    await t.test('완료조건 3: 비밀번호 변경 후 기존 비밀번호로 로그인 시도 시 401', async () => {
      const res = await supertest(app).post('/api/v1/auth/login').send({
        email: USER_EMAIL,
        password: PASSWORD,
      });
      assert.equal(res.status, 401);
    });

    await t.test('완료조건 3: 비밀번호 변경 후 신규 비밀번호로 로그인 시 200 + accessToken 반환', async () => {
      const res = await supertest(app).post('/api/v1/auth/login').send({
        email: USER_EMAIL,
        password: NEW_PASSWORD,
      });
      assert.equal(res.status, 200);
      assert.equal(typeof res.body.accessToken, 'string');

      // 이후 테스트에서 최신 토큰이 필요하므로 갱신해둔다.
      user.token = res.body.accessToken;
    });

    await t.test('완료조건(부가): 닉네임과 비밀번호 동시 변경 요청도 200으로 처리', async () => {
      const combinedNickname = '동시변경닉네임';
      const combinedPassword = 'CombinedPassw0rd!';

      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ nickname: combinedNickname, password: combinedPassword });

      assert.equal(res.status, 200);
      assert.equal(res.body.nickname, combinedNickname);

      const rows = await pool.query('SELECT nickname FROM users WHERE id = $1', [user.userId]);
      assert.equal(rows.rows[0].nickname, combinedNickname);

      const loginRes = await supertest(app).post('/api/v1/auth/login').send({
        email: USER_EMAIL,
        password: combinedPassword,
      });
      assert.equal(loginRes.status, 200);
      user.token = loginRes.body.accessToken;
    });
  }
);
