'use strict';

// BE-1 완료조건 3 검증: GET /api/v1/health가 200을 반환하고 DB 커넥션 획득에 성공하는지 확인한다.
// 개발 DB(todolist_dev)를 오염시키지 않기 위해 todolist_test DB를 사용한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const APP_PATH = path.resolve(__dirname, '..', '..', '..', 'src', 'app.js');
const appExists = fs.existsSync(APP_PATH);

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

test('src/app.js가 아직 없으면 skip', { skip: appExists && !!supertest }, () => {
  if (!appExists) {
    console.log('[health.test] src/app.js가 아직 존재하지 않아 skip 합니다.');
  } else if (!supertest) {
    console.log('[health.test] supertest가 설치되어 있지 않아 skip 합니다.');
  }
});

test(
  'GET /api/v1/health는 200과 db.status=connected를 반환한다',
  { skip: !appExists || !supertest },
  async () => {
    await ensureTestDatabase();
    await ensureMigrationsApplied();

    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.NODE_ENV = 'test';

    // src/config/db.pool.js가 process.env.DATABASE_URL을 env.js를 통해 읽으므로
    // require.cache를 지워 새로 로드해야 override가 반영된다.
    for (const key of Object.keys(require.cache)) {
      if (key.startsWith(path.resolve(__dirname, '..', '..', '..', 'src'))) {
        delete require.cache[key];
      }
    }

    try {
      const app = require(APP_PATH);
      const res = await supertest(app).get('/api/v1/health');

      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.equal(res.body.db.status, 'connected');
      assert.equal(typeof res.body.db.latencyMs, 'number');
    } finally {
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
      for (const key of Object.keys(require.cache)) {
        if (key.startsWith(path.resolve(__dirname, '..', '..', '..', 'src'))) {
          delete require.cache[key];
        }
      }
    }
  }
);
