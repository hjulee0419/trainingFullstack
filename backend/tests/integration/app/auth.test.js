'use strict';

// BE-2(인증 API) 완료조건 통합 검증:
// 1) 회원가입 성공 시 201 + users/categories(is_default=true) row 동시 생성 확인
// 2) 이메일 중복 시 409, 추가 row 생성 안 됨
// 3) 필수값/형식 오류 시 400
// 4) 비밀번호가 bcrypt 해시로 저장됨을 DB 조회로 확인
// 5) 로그인 성공 시 200 + JWT 반환
// 6) 잘못된 이메일/비밀번호 모두 동일 메시지로 401(계정 존재 여부 비노출)
// 7) 토큰 없이/위조 토큰으로 보호 라우트 호출 시 401
// 8) 정상 JWT로 req.user.id 주입 확인
//
// 개발 DB(todolist_dev)를 오염시키지 않기 위해 todolist_test DB를 사용한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { Pool } = require('pg');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', 'src');
const APP_PATH = path.join(SRC_ROOT, 'app.js');
const MIDDLEWARE_PATH = path.join(SRC_ROOT, 'middlewares', 'auth.middleware.js');
const ERROR_HANDLER_PATH = path.join(SRC_ROOT, 'middlewares', 'error-handler.js');

const appExists = fs.existsSync(APP_PATH);

let supertest;
try {
  supertest = require('supertest');
} catch (err) {
  supertest = null;
}

let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (err) {
  bcrypt = null;
}

const {
  ensureTestDatabase,
  ensureMigrationsApplied,
  TEST_DATABASE_URL,
} = require('../db/setup');

const shouldSkip = !appExists || !supertest || !bcrypt;

if (!appExists) {
  console.log('[auth.test] src/app.js가 아직 존재하지 않아 skip 합니다.');
} else if (!supertest) {
  console.log('[auth.test] supertest가 설치되어 있지 않아 skip 합니다.');
} else if (!bcrypt) {
  console.log('[auth.test] bcrypt가 설치되어 있지 않아 skip 합니다.');
}

test('src/app.js 또는 의존성이 아직 없으면 skip', { skip: !shouldSkip }, () => {
  console.log('[auth.test] 위 사유로 전체 테스트를 skip 합니다.');
});

const EMAIL_PREFIX = 'auth-test-';
const SIGNUP_EMAIL = `${EMAIL_PREFIX}signup@example.com`;
const DUP_EMAIL = `${EMAIL_PREFIX}dup@example.com`;
const LOGIN_EMAIL = `${EMAIL_PREFIX}login@example.com`;
const PASSWORD = 'password123';

function clearSrcRequireCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC_ROOT)) {
      delete require.cache[key];
    }
  }
}

test(
  'BE-2 인증 API 통합 테스트',
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
      await pool.query('DELETE FROM users WHERE email LIKE $1', [`${EMAIL_PREFIX}%`]);
    });

    app = require(APP_PATH);

    await t.test('완료조건 1,4: 회원가입 성공 시 201 + users/categories row 동시 생성, 비밀번호는 bcrypt 해시로 저장', async () => {
      const res = await supertest(app).post('/api/v1/auth/signup').send({
        email: SIGNUP_EMAIL,
        password: PASSWORD,
        nickname: '테스트유저',
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.email, SIGNUP_EMAIL);
      assert.equal(res.body.nickname, '테스트유저');
      // id는 users.id(BIGSERIAL) 컬럼 값으로, pg 드라이버가 정밀도 손실 방지를 위해
      // bigint를 문자열로 반환한다. number/string 어느 쪽이든 존재 및 값 매칭만 확인한다.
      assert.ok(res.body.id !== undefined && res.body.id !== null);
      assert.ok(res.body.createdAt);
      assert.equal(res.body.password, undefined);
      assert.equal(res.body.passwordHash, undefined);

      const userRows = await pool.query('SELECT * FROM users WHERE email = $1', [SIGNUP_EMAIL]);
      assert.equal(userRows.rows.length, 1);

      const passwordHash = userRows.rows[0].password_hash;
      assert.notEqual(passwordHash, PASSWORD);
      const isMatch = await bcrypt.compare(PASSWORD, passwordHash);
      assert.equal(isMatch, true);

      const categoryRows = await pool.query(
        'SELECT * FROM categories WHERE user_id = $1 AND is_default = true',
        [userRows.rows[0].id]
      );
      assert.equal(categoryRows.rows.length, 1);
    });

    await t.test('완료조건 2: 동일 이메일 재가입 시 409, 추가 row 생성 안 됨', async () => {
      const first = await supertest(app).post('/api/v1/auth/signup').send({
        email: DUP_EMAIL,
        password: PASSWORD,
        nickname: '중복테스트',
      });
      assert.equal(first.status, 201);

      const countBefore = await pool.query('SELECT count(*) FROM users WHERE email = $1', [DUP_EMAIL]);
      assert.equal(countBefore.rows[0].count, '1');

      const second = await supertest(app).post('/api/v1/auth/signup').send({
        email: DUP_EMAIL,
        password: PASSWORD,
        nickname: '중복테스트2',
      });
      assert.equal(second.status, 409);

      const countAfter = await pool.query('SELECT count(*) FROM users WHERE email = $1', [DUP_EMAIL]);
      assert.equal(countAfter.rows[0].count, '1');
    });

    await t.test('완료조건 3: 이메일 형식 오류 시 400', async () => {
      const res = await supertest(app).post('/api/v1/auth/signup').send({
        email: 'not-an-email',
        password: PASSWORD,
        nickname: '닉네임',
      });
      assert.equal(res.status, 400);
    });

    await t.test('완료조건 3: 비밀번호 7자(최소 8자 미만) 시 400', async () => {
      const res = await supertest(app).post('/api/v1/auth/signup').send({
        email: `${EMAIL_PREFIX}shortpw@example.com`,
        password: '1234567',
        nickname: '닉네임',
      });
      assert.equal(res.status, 400);
    });

    await t.test('완료조건 3: nickname 빈 문자열 시 400', async () => {
      const res = await supertest(app).post('/api/v1/auth/signup').send({
        email: `${EMAIL_PREFIX}emptynick@example.com`,
        password: PASSWORD,
        nickname: '',
      });
      assert.equal(res.status, 400);
    });

    let accessToken;
    let loginUserId;

    await t.test('완료조건 5: 로그인 성공 시 200 + JWT 반환', async () => {
      const signupRes = await supertest(app).post('/api/v1/auth/signup').send({
        email: LOGIN_EMAIL,
        password: PASSWORD,
        nickname: '로그인테스트',
      });
      assert.equal(signupRes.status, 201);

      const res = await supertest(app).post('/api/v1/auth/login').send({
        email: LOGIN_EMAIL,
        password: PASSWORD,
      });

      assert.equal(res.status, 200);
      assert.equal(typeof res.body.accessToken, 'string');
      assert.match(res.body.accessToken, /^[\w-]+\.[\w-]+\.[\w-]+$/);
      assert.equal(res.body.tokenType, 'Bearer');
      assert.equal(res.body.user.id, signupRes.body.id);

      accessToken = res.body.accessToken;
      loginUserId = signupRes.body.id;
    });

    await t.test('완료조건 6: 잘못된 비밀번호로 로그인 시 401 + 통합 메시지', async () => {
      const res = await supertest(app).post('/api/v1/auth/login').send({
        email: LOGIN_EMAIL,
        password: 'wrong-password',
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.message, '이메일 또는 비밀번호가 올바르지 않습니다.');
    });

    await t.test('완료조건 6: 존재하지 않는 이메일로 로그인 시 401 + 동일한 통합 메시지', async () => {
      const res = await supertest(app).post('/api/v1/auth/login').send({
        email: `${EMAIL_PREFIX}nonexistent@example.com`,
        password: PASSWORD,
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.message, '이메일 또는 비밀번호가 올바르지 않습니다.');
    });

    await t.test('완료조건 6(부가): 두 401 응답의 message가 완전히 동일하다', async () => {
      const wrongPassword = await supertest(app).post('/api/v1/auth/login').send({
        email: LOGIN_EMAIL,
        password: 'wrong-password',
      });
      const noSuchEmail = await supertest(app).post('/api/v1/auth/login').send({
        email: `${EMAIL_PREFIX}nonexistent2@example.com`,
        password: PASSWORD,
      });

      assert.equal(wrongPassword.status, 401);
      assert.equal(noSuchEmail.status, 401);
      assert.equal(wrongPassword.body.message, noSuchEmail.body.message);
    });

    // 완료조건 7, 8: requireAuth를 부착한 미니 보호 라우트를 별도로 구성해 검증.
    // 운영 app.js에는 보호 라우트가 없으므로(BE-2 범위는 인증 자체) express()로 별도 mini-app을 만든다.
    await t.test('완료조건 7,8: 미니 보호 라우트를 통한 requireAuth 검증', async (t2) => {
      const express = require('express');
      const { requireAuth } = require(MIDDLEWARE_PATH);
      const { errorHandler } = require(ERROR_HANDLER_PATH);

      const miniApp = express();
      miniApp.use(express.json());
      const router = express.Router();
      router.get('/protected', requireAuth, (req, res) => {
        res.json({ userId: req.user.id });
      });
      miniApp.use(router);
      miniApp.use(errorHandler);

      await t2.test('토큰 없이 호출 시 401', async () => {
        const res = await supertest(miniApp).get('/protected');
        assert.equal(res.status, 401);
      });

      await t2.test('위조 토큰으로 호출 시 401', async () => {
        const res = await supertest(miniApp).get('/protected').set('Authorization', 'Bearer invalid.token.here');
        assert.equal(res.status, 401);
      });

      await t2.test('정상 JWT로 호출 시 200 + req.user.id 주입 확인', async () => {
        assert.ok(accessToken, '이전 로그인 테스트에서 accessToken을 획득했어야 함');
        const res = await supertest(miniApp).get('/protected').set('Authorization', `Bearer ${accessToken}`);
        assert.equal(res.status, 200);
        assert.equal(typeof res.body.userId, 'number');
        // loginUserId는 로그인 응답의 user.id(pg가 bigint를 문자열로 반환)이므로 문자열로 정규화해 비교한다.
        assert.equal(String(res.body.userId), String(loginUserId));
      });
    });
  }
);
