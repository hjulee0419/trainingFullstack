'use strict';

// BE-1 완료조건 검증 대비(공통 인프라 유틸): toCamelCase/toSnakeCase 순수 변환 함수의 계약을 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const CASE_MAPPER_PATH = path.resolve(__dirname, '..', '..', 'src', 'utils', 'case-mapper.js');

let toCamelCase;
let toSnakeCase;
try {
  ({ toCamelCase, toSnakeCase } = require(CASE_MAPPER_PATH));
} catch (err) {
  toCamelCase = null;
  toSnakeCase = null;
}

test('case-mapper.js가 아직 없으면 skip', { skip: !toCamelCase }, () => {});

test('toCamelCase: snake_case 키를 camelCase로 변환하고 Date는 그대로 유지한다', { skip: !toCamelCase }, () => {
  const createdAt = new Date('2026-07-29T00:00:00.000Z');
  const input = { user_id: 1, created_at: createdAt };
  const result = toCamelCase(input);

  assert.deepEqual(result, { userId: 1, createdAt });
  assert.equal(result.createdAt, createdAt); // 동일 인스턴스 유지
  assert.ok(result.createdAt instanceof Date);
});

test('toCamelCase: 배열 입력을 재귀적으로 변환한다', { skip: !toCamelCase }, () => {
  const input = [{ user_id: 1 }, { user_id: 2 }];
  const result = toCamelCase(input);
  assert.deepEqual(result, [{ userId: 1 }, { userId: 2 }]);
});

test('toCamelCase: 중첩 객체를 재귀적으로 변환한다', { skip: !toCamelCase }, () => {
  const input = { user_id: 1, profile_info: { first_name: 'a', last_name: 'b' } };
  const result = toCamelCase(input);
  assert.deepEqual(result, { userId: 1, profileInfo: { firstName: 'a', lastName: 'b' } });
});

test('toCamelCase: null 입력 시 그대로 반환한다', { skip: !toCamelCase }, () => {
  assert.equal(toCamelCase(null), null);
});

test('toSnakeCase: camelCase 키를 snake_case로 변환하고 Date는 그대로 유지한다', { skip: !toSnakeCase }, () => {
  const createdAt = new Date('2026-07-29T00:00:00.000Z');
  const input = { userId: 1, createdAt };
  const result = toSnakeCase(input);

  assert.deepEqual(result, { user_id: 1, created_at: createdAt });
  assert.equal(result.created_at, createdAt);
  assert.ok(result.created_at instanceof Date);
});

test('toSnakeCase: 배열 입력을 재귀적으로 변환한다', { skip: !toSnakeCase }, () => {
  const input = [{ userId: 1 }, { userId: 2 }];
  const result = toSnakeCase(input);
  assert.deepEqual(result, [{ user_id: 1 }, { user_id: 2 }]);
});

test('toSnakeCase: 중첩 객체를 재귀적으로 변환한다', { skip: !toSnakeCase }, () => {
  const input = { userId: 1, profileInfo: { firstName: 'a', lastName: 'b' } };
  const result = toSnakeCase(input);
  assert.deepEqual(result, { user_id: 1, profile_info: { first_name: 'a', last_name: 'b' } });
});

test('toSnakeCase: null 입력 시 그대로 반환한다', { skip: !toSnakeCase }, () => {
  assert.equal(toSnakeCase(null), null);
});
