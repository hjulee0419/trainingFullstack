'use strict';

// BE-1 완료조건 검증 대비(공통 인프라 유틸): withTransaction의 BEGIN/COMMIT/ROLLBACK/release 계약을 mock pool/client로 검증한다.

const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const WITH_TRANSACTION_PATH = path.resolve(__dirname, '..', '..', 'src', 'utils', 'with-transaction.js');

let withTransaction;
try {
  ({ withTransaction } = require(WITH_TRANSACTION_PATH));
} catch (err) {
  withTransaction = null;
}

function createMockClient() {
  return {
    query: mock.fn(async () => ({ rows: [] })),
    release: mock.fn(),
  };
}

test('with-transaction.js가 아직 없으면 skip', { skip: !withTransaction }, () => {});

test('정상 케이스: fn의 반환값이 그대로 반환되고 BEGIN/COMMIT이 순서대로 호출되며 release가 호출된다', { skip: !withTransaction }, async () => {
  const client = createMockClient();
  const pool = { connect: async () => client };

  const result = await withTransaction(pool, async (c) => {
    assert.equal(c, client);
    return 'fn-result';
  });

  assert.equal(result, 'fn-result');
  assert.equal(client.query.mock.callCount(), 2);
  assert.equal(client.query.mock.calls[0].arguments[0], 'BEGIN');
  assert.equal(client.query.mock.calls[1].arguments[0], 'COMMIT');
  assert.equal(client.release.mock.callCount(), 1);
});

test('실패 케이스: fn이 throw하면 ROLLBACK이 호출되고 원래 에러가 재throw되며 release는 그래도 호출된다', { skip: !withTransaction }, async () => {
  const client = createMockClient();
  const pool = { connect: async () => client };
  const expectedError = new Error('tx-boom');

  await assert.rejects(
    () =>
      withTransaction(pool, async () => {
        throw expectedError;
      }),
    (err) => err === expectedError
  );

  assert.equal(client.query.mock.callCount(), 2);
  assert.equal(client.query.mock.calls[0].arguments[0], 'BEGIN');
  assert.equal(client.query.mock.calls[1].arguments[0], 'ROLLBACK');
  assert.equal(client.release.mock.callCount(), 1);
});
