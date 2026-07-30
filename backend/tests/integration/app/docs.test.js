'use strict';

// Swagger UI(swagger/swagger.json 서빙) 스모크 테스트.
// GET /api/v1/docs가 200 HTML을 반환하고, helmet 기본 CSP(script-src 'self')로 인해
// 인라인 스크립트가 차단되지 않도록 이 라우트에서만 CSP가 완화되어 있는지 확인한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', 'src');
const APP_PATH = path.join(SRC_ROOT, 'app.js');
const DOCS_ROUTES_PATH = path.join(SRC_ROOT, 'routes', 'docs.routes.js');

const depsExist = fs.existsSync(APP_PATH) && fs.existsSync(DOCS_ROUTES_PATH);

let supertest;
try {
  supertest = require('supertest');
} catch (err) {
  supertest = null;
}

const canRun = depsExist && !!supertest;

function loadAppAgainstTestDb() {
  const { ensureTestDatabase, TEST_DATABASE_URL } = require('../db/setup');
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  delete require.cache[require.resolve(APP_PATH)];
  return ensureTestDatabase().then(() => require(APP_PATH));
}

test('src/app.js 또는 docs.routes.js가 아직 없으면 skip', { skip: canRun }, () => {
  console.log('[docs.test] 대상 파일이 아직 없어 skip 합니다.');
});

test('GET /api/v1/docs는 200 HTML을 반환한다', { skip: !canRun }, async () => {
  const app = await loadAppAgainstTestDb();

  const res = await supertest(app).get('/api/v1/docs/');

  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /html/);
  assert.match(res.text, /swagger-ui/i);
});

test('docs 라우트는 script-src에 unsafe-inline을 허용하도록 CSP가 완화되어 있다', { skip: !canRun }, async () => {
  const app = await loadAppAgainstTestDb();

  const res = await supertest(app).get('/api/v1/docs/');

  const csp = res.headers['content-security-policy'] || '';
  assert.match(csp, /script-src[^;]*'unsafe-inline'/, 'docs 라우트 CSP는 인라인 스크립트를 허용해야 함');
});

test('다른 라우트(health)는 기본 CSP(script-src \'self\'만)를 그대로 유지한다', { skip: !canRun }, async () => {
  const app = await loadAppAgainstTestDb();

  const res = await supertest(app).get('/api/v1/health');

  const csp = res.headers['content-security-policy'] || '';
  assert.match(csp, /script-src 'self'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/, 'docs 이외 라우트는 CSP가 완화되면 안 됨');
});
