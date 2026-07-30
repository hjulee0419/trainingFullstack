'use strict';

const { AppError } = require('../utils/app-error');

const MAX_NAME_LENGTH = 50;

function validateName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new AppError(400, '카테고리 이름을 입력해주세요.');
  }

  const trimmedName = name.trim();
  if (trimmedName.length > MAX_NAME_LENGTH) {
    throw new AppError(400, `카테고리 이름은 최대 ${MAX_NAME_LENGTH}자까지 입력할 수 있습니다.`);
  }

  return trimmedName;
}

function validateCreateCategoryRequest(body) {
  const { name } = body || {};
  return { name: validateName(name) };
}

function validateUpdateCategoryRequest(body) {
  const { name } = body || {};
  return { name: validateName(name) };
}

module.exports = { validateCreateCategoryRequest, validateUpdateCategoryRequest };
