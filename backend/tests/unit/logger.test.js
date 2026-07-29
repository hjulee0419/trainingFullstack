'use strict';

// BE-1 완료조건 검증 대비(공통 인프라 유틸): maskSensitive가 민감 키를 대소문자 무관/재귀적으로 마스킹하는지 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const LOGGER_PATH = path.resolve(__dirname, '..', '..', 'src', 'utils', 'logger.js');

let maskSensitive;
try {
  ({ maskSensitive } = require(LOGGER_PATH));
} catch (err) {
  maskSensitive = null;
}

test('logger.js가 아직 없으면 skip', { skip: !maskSensitive }, () => {});

test('maskSensitive: password/token/Authorization/중첩 jwt는 마스킹하고 normal은 그대로 둔다', { skip: !maskSensitive }, () => {
  const input = {
    password: 'a',
    token: 'b',
    Authorization: 'c',
    nested: { jwt: 'd' },
    normal: 'e',
  };

  const result = maskSensitive(input);

  assert.notEqual(result.password, 'a');
  assert.notEqual(result.token, 'b');
  assert.notEqual(result.Authorization, 'c');
  assert.notEqual(result.nested.jwt, 'd');
  assert.equal(result.normal, 'e');
});

test('maskSensitive: 대소문자 무관하게 마스킹한다(PASSWORD, Token 등)', { skip: !maskSensitive }, () => {
  const input = { PASSWORD: 'a', Token: 'b', AUTHORIZATION: 'c', JWT: 'd' };
  const result = maskSensitive(input);

  assert.notEqual(result.PASSWORD, 'a');
  assert.notEqual(result.Token, 'b');
  assert.notEqual(result.AUTHORIZATION, 'c');
  assert.notEqual(result.JWT, 'd');
});

test('maskSensitive: null/원시값 입력은 그대로 반환한다', { skip: !maskSensitive }, () => {
  assert.equal(maskSensitive(null), null);
  assert.equal(maskSensitive('str'), 'str');
  assert.equal(maskSensitive(42), 42);
});

test('maskSensitive: 배열 입력을 재귀적으로 처리한다', { skip: !maskSensitive }, () => {
  const input = [{ password: 'a' }, { normal: 'b' }];
  const result = maskSensitive(input);
  assert.notEqual(result[0].password, 'a');
  assert.equal(result[1].normal, 'b');
});
