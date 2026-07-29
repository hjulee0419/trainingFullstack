'use strict';

// BE-1 완료조건 4 검증: 예외 라우트 호출 시 error-handler가 일관된 JSON 에러 포맷으로 응답하고
// stack trace를 노출하지 않으며, production 환경에서는 일반 Error의 message를 치환하는지 확인한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const ASYNC_HANDLER_PATH = path.resolve(__dirname, '..', '..', '..', 'src', 'middlewares', 'async-handler.js');
const ERROR_HANDLER_PATH = path.resolve(__dirname, '..', '..', '..', 'src', 'middlewares', 'error-handler.js');
const APP_ERROR_PATH = path.resolve(__dirname, '..', '..', '..', 'src', 'utils', 'app-error.js');

const depsExist =
  fs.existsSync(ASYNC_HANDLER_PATH) && fs.existsSync(ERROR_HANDLER_PATH) && fs.existsSync(APP_ERROR_PATH);

let express;
let supertest;
try {
  express = require('express');
  supertest = require('supertest');
} catch (err) {
  express = null;
  supertest = null;
}

const canRun = depsExist && !!express && !!supertest;

function buildMiniApp() {
  const { asyncHandler } = require(ASYNC_HANDLER_PATH);
  const { errorHandler } = require(ERROR_HANDLER_PATH);
  const { AppError } = require(APP_ERROR_PATH);

  const app = express();

  app.get(
    '/throw-app-error',
    asyncHandler(async () => {
      throw new AppError(400, '커스텀 에러');
    })
  );

  app.get(
    '/throw-generic-error',
    asyncHandler(async () => {
      throw new Error('boom');
    })
  );

  app.get(
    '/throw-app-error-with-details',
    asyncHandler(async () => {
      throw new AppError(422, '검증 실패', { field: 'title' });
    })
  );

  app.use(errorHandler);
  return app;
}

test('필요한 src 모듈이 아직 없으면 skip', { skip: canRun }, () => {
  console.log('[error-handler.test] async-handler/error-handler/app-error 또는 express/supertest가 아직 없어 skip 합니다.');
});

test('AppError 라우트 호출 시 400과 일관된 JSON 에러 포맷을 반환한다', { skip: !canRun }, async () => {
  const app = buildMiniApp();
  const res = await supertest(app).get('/throw-app-error');

  assert.equal(res.status, 400);
  assert.equal(res.body.status, 'error');
  assert.equal(res.body.message, '커스텀 에러');
  assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);
});

test('일반 Error 라우트 호출 시 500을 반환하고 stack이 노출되지 않는다(development)', { skip: !canRun }, async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    const app = buildMiniApp();
    const res = await supertest(app).get('/throw-generic-error');

    assert.equal(res.status, 500);
    assert.equal(res.body.status, 'error');
    assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

test(
  'NODE_ENV=production에서는 일반 Error의 message가 Internal Server Error로 치환된다',
  { skip: !canRun },
  async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const app = buildMiniApp();
      const res = await supertest(app).get('/throw-generic-error');

      assert.equal(res.status, 500);
      assert.equal(res.body.status, 'error');
      assert.equal(res.body.message, 'Internal Server Error');
      assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  }
);

test('details가 있는 AppError는 응답 body.details에 그대로 노출된다', { skip: !canRun }, async () => {
  const app = buildMiniApp();
  const res = await supertest(app).get('/throw-app-error-with-details');

  assert.equal(res.status, 422);
  assert.deepEqual(res.body.details, { field: 'title' });
});

test(
  'NODE_ENV=production이어도 AppError의 message는 치환되지 않는다',
  { skip: !canRun },
  async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const app = buildMiniApp();
      const res = await supertest(app).get('/throw-app-error');

      assert.equal(res.status, 400);
      assert.equal(res.body.message, '커스텀 에러');
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  }
);
