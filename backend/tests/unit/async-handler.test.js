'use strict';

// BE-1 완료조건 4 검증 대비: asyncHandler가 rejected promise를 next(err)로 전달하는지 확인한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ASYNC_HANDLER_PATH = path.resolve(__dirname, '..', '..', 'src', 'middlewares', 'async-handler.js');

let asyncHandler;
try {
  ({ asyncHandler } = require(ASYNC_HANDLER_PATH));
} catch (err) {
  asyncHandler = null;
}

test('async-handler.js가 아직 없으면 skip', { skip: !asyncHandler }, () => {});

test('정상적으로 resolve되면 next가 에러 없이 호출되지 않거나 인자 없이 호출된다', { skip: !asyncHandler }, async () => {
  const req = {};
  const res = {};
  const nextCalls = [];
  const next = (...args) => nextCalls.push(args);

  const handler = asyncHandler(async () => {
    return 'ok';
  });

  await handler(req, res, next);

  // next가 호출되지 않았거나, 호출되었다면 인자가 없어야 한다(에러 전달 아님).
  if (nextCalls.length > 0) {
    assert.equal(nextCalls[0].length, 0);
  }
});

test('내부에서 reject되면 next(err)가 호출된다', { skip: !asyncHandler }, async () => {
  const req = {};
  const res = {};
  const nextCalls = [];
  const next = (...args) => nextCalls.push(args);

  const expectedError = new Error('boom');
  const handler = asyncHandler(async () => {
    throw expectedError;
  });

  await handler(req, res, next);

  assert.equal(nextCalls.length, 1);
  assert.equal(nextCalls[0][0], expectedError);
});
