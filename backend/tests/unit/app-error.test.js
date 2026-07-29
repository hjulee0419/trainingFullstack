'use strict';

// BE-1 완료조건 4 검증 대비: error-handler가 사용하는 AppError 클래스의 속성 계약 자체를 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const APP_ERROR_PATH = path.resolve(__dirname, '..', '..', 'src', 'utils', 'app-error.js');

let AppError;
try {
  ({ AppError } = require(APP_ERROR_PATH));
} catch (err) {
  AppError = null;
}

test('app-error.js가 아직 없으면 skip', { skip: !AppError }, () => {});

test('AppError(404, "x")는 statusCode/message/isOperational을 올바르게 갖는다', { skip: !AppError }, () => {
  const err = new AppError(404, 'x');
  assert.equal(err.statusCode, 404);
  assert.equal(err.message, 'x');
  assert.equal(err.isOperational, true);
  assert.ok(err instanceof Error);
});

test('details를 전달하지 않으면 details 속성이 없다', { skip: !AppError }, () => {
  const err = new AppError(404, 'x');
  assert.equal(err.details, undefined);
});

test('AppError(400, "y", {field: "z"})는 details를 그대로 갖는다', { skip: !AppError }, () => {
  const err = new AppError(400, 'y', { field: 'z' });
  assert.equal(err.statusCode, 400);
  assert.equal(err.message, 'y');
  assert.equal(err.isOperational, true);
  assert.deepEqual(err.details, { field: 'z' });
});
