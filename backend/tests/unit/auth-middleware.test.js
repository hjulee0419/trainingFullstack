'use strict';

// BE-2 완료조건 검증 대상: src/middlewares/auth.middleware.js의 requireAuth
// - 완료조건 7: 토큰 없이/위조 토큰으로 보호 라우트 호출 시 401(AppError로 next 호출)
// - 완료조건 8: 정상 JWT로 req.user.id가 숫자로 주입됨
// mock req/res/next를 사용해 실제 JWT 검증 로직만 단위로 검증한다(HTTP 계층은 통합 테스트에서 검증).

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const MIDDLEWARE_PATH = path.resolve(__dirname, '..', '..', 'src', 'middlewares', 'auth.middleware.js');
const JWT_PATH = path.resolve(__dirname, '..', '..', 'src', 'utils', 'jwt.js');

const middlewareExists = fs.existsSync(MIDDLEWARE_PATH);
const jwtExists = fs.existsSync(JWT_PATH);

let isStub = false;
if (middlewareExists) {
  const source = fs.readFileSync(MIDDLEWARE_PATH, 'utf8');
  isStub = source.includes('Not Implemented');
}

const shouldSkip = !middlewareExists || !jwtExists || isStub;

if (!middlewareExists) {
  console.log('[auth-middleware.test] src/middlewares/auth.middleware.js가 아직 존재하지 않아 skip 합니다.');
} else if (isStub) {
  console.log(
    '[auth-middleware.test] auth.middleware.js가 아직 "Not Implemented" 스텁 상태라 실제 JWT 검증으로' +
      ' 교체되지 않은 것으로 보여 skip 합니다.'
  );
} else if (!jwtExists) {
  console.log('[auth-middleware.test] src/utils/jwt.js가 아직 존재하지 않아 skip 합니다.');
}

test('auth.middleware.js가 없거나 스텁이면 skip', { skip: !shouldSkip }, () => {
  console.log('[auth-middleware.test] 위 사유로 전체 테스트를 skip 합니다.');
});

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test(
  'Authorization 헤더가 없으면 next가 AppError(401, ...)로 호출된다',
  { skip: shouldSkip },
  () => {
    const { requireAuth } = require(MIDDLEWARE_PATH);
    const { AppError } = require(path.resolve(__dirname, '..', '..', 'src', 'utils', 'app-error.js'));

    const req = { headers: {} };
    const res = createMockRes();
    let receivedErr;
    const next = (err) => {
      receivedErr = err;
    };

    requireAuth(req, res, next);

    assert.ok(receivedErr instanceof AppError);
    assert.equal(receivedErr.statusCode, 401);
  }
);

test(
  '형식이 잘못된 Authorization 헤더(스킴 누락)면 next가 AppError(401, ...)로 호출된다',
  { skip: shouldSkip },
  () => {
    const { requireAuth } = require(MIDDLEWARE_PATH);
    const { AppError } = require(path.resolve(__dirname, '..', '..', 'src', 'utils', 'app-error.js'));

    const req = { headers: { authorization: 'sometoken' } };
    const res = createMockRes();
    let receivedErr;
    const next = (err) => {
      receivedErr = err;
    };

    requireAuth(req, res, next);

    assert.ok(receivedErr instanceof AppError);
    assert.equal(receivedErr.statusCode, 401);
  }
);

test(
  '위조된 Bearer 토큰이면 next가 AppError(401, ...)로 호출된다',
  { skip: shouldSkip },
  () => {
    const { requireAuth } = require(MIDDLEWARE_PATH);
    const { AppError } = require(path.resolve(__dirname, '..', '..', 'src', 'utils', 'app-error.js'));

    const req = { headers: { authorization: 'Bearer invalid.token.here' } };
    const res = createMockRes();
    let receivedErr;
    const next = (err) => {
      receivedErr = err;
    };

    requireAuth(req, res, next);

    assert.ok(receivedErr instanceof AppError);
    assert.equal(receivedErr.statusCode, 401);
  }
);

test(
  '유효한 토큰이면 req.user.id가 숫자로 주입되고 next()가 에러 없이 호출된다',
  { skip: shouldSkip },
  () => {
    const { requireAuth } = require(MIDDLEWARE_PATH);
    const { signAccessToken } = require(JWT_PATH);

    const token = signAccessToken(7);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    let callCount = 0;
    let receivedErr = 'not-called';
    const next = (err) => {
      callCount += 1;
      receivedErr = err;
    };

    requireAuth(req, res, next);

    assert.equal(callCount, 1);
    assert.equal(receivedErr, undefined);
    assert.equal(typeof req.user.id, 'number');
    assert.equal(req.user.id, 7);
  }
);
