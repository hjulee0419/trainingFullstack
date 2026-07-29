'use strict';

// BE-1 완료조건 3 보강: DB 커넥션 획득에 실패하면 checkHealth가 AppError(503)을 던지는지
// (health.test.js는 정상 커넥션 경로만 다루므로, 이 파일은 실패 분기를 단위 테스트로 커버한다)

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const HEALTH_CONTROLLER_PATH = path.resolve(__dirname, '..', '..', 'src', 'controllers', 'health.controller.js');
const DB_POOL_PATH = path.resolve(__dirname, '..', '..', 'src', 'config', 'db.pool.js');

const depsExist = fs.existsSync(HEALTH_CONTROLLER_PATH) && fs.existsSync(DB_POOL_PATH);

test('health.controller.js/db.pool.js가 아직 없으면 skip', { skip: depsExist }, () => {
  console.log('[health-controller.test] 대상 파일이 아직 없어 skip 합니다.');
});

test(
  'DB 쿼리가 실패하면 checkHealth가 AppError(503, ...)를 next로 전달한다',
  { skip: !depsExist },
  async (t) => {
    const dbPoolResolved = require.resolve(DB_POOL_PATH);
    delete require.cache[dbPoolResolved];
    delete require.cache[require.resolve(HEALTH_CONTROLLER_PATH)];

    // db.pool.js를 require.cache에 가짜 모듈로 선등록해, health.controller.js가
    // require('../config/db.pool')할 때 실패하는 pool을 받도록 한다.
    require.cache[dbPoolResolved] = {
      id: dbPoolResolved,
      filename: dbPoolResolved,
      loaded: true,
      exports: {
        getPool: () => ({
          query: () => Promise.reject(new Error('connection refused')),
        }),
      },
    };
    t.after(() => {
      delete require.cache[dbPoolResolved];
    });

    const { checkHealth } = require(HEALTH_CONTROLLER_PATH);

    const req = {};
    const res = {
      status() {
        return this;
      },
      json() {
        return this;
      },
    };

    let receivedErr;
    const next = (err) => {
      receivedErr = err;
    };

    await checkHealth(req, res, next);

    assert.ok(receivedErr, 'next가 에러와 함께 호출되어야 함');
    assert.equal(receivedErr.statusCode, 503);
    assert.equal(receivedErr.message, 'Database connection failed');

    delete require.cache[require.resolve(HEALTH_CONTROLLER_PATH)];
  }
);
