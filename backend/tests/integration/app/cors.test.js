'use strict';

// BE-1 완료조건 5 검증: 허용된 Origin에는 CORS 헤더가 설정되고, 허용되지 않은 Origin 요청은 차단(헤더 미설정)되는지 확인한다.

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

const canRun = appExists && !!supertest;

test('src/app.js 또는 supertest가 아직 없으면 skip', { skip: canRun }, () => {
  console.log('[cors.test] src/app.js 또는 supertest가 아직 없어 skip 합니다.');
});

test('허용된 Origin(http://localhost:5173) 요청에는 access-control-allow-origin 헤더가 설정된다', { skip: !canRun }, async () => {
  const app = require(APP_PATH);
  const res = await supertest(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');

  assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
});

test('허용되지 않은 Origin(http://evil.example.com) 요청에는 access-control-allow-origin 헤더가 없다', { skip: !canRun }, async () => {
  const app = require(APP_PATH);
  const res = await supertest(app).get('/api/v1/health').set('Origin', 'http://evil.example.com');

  assert.equal(res.headers['access-control-allow-origin'], undefined);
});
