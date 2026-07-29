'use strict';

// snake_case <-> camelCase 순수 변환 유틸.
// 재귀적으로 배열/중첩 객체를 처리하되 Date 인스턴스와 null은 변환하지 않고 그대로 통과시킨다.

function snakeToCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function camelToSnakeKey(key) {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function transform(value, keyMapper) {
  if (value === null || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => transform(item, keyMapper));
  }

  if (isPlainObject(value)) {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      result[keyMapper(key)] = transform(val, keyMapper);
    }
    return result;
  }

  return value;
}

function toCamelCase(row) {
  return transform(row, snakeToCamelKey);
}

function toSnakeCase(obj) {
  return transform(obj, camelToSnakeKey);
}

module.exports = { toCamelCase, toSnakeCase };
