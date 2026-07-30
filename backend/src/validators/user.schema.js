'use strict';

const { AppError } = require('../utils/app-error');

const MIN_PASSWORD_LENGTH = 8;
const NO_FIELDS_MESSAGE = '수정할 항목(닉네임 또는 비밀번호)을 하나 이상 입력해주세요.';

function validateNickname(nickname) {
  if (typeof nickname !== 'string' || nickname.trim() === '') {
    throw new AppError(400, '닉네임을 입력해주세요.');
  }
  return nickname.trim();
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
  }
  return password;
}

function validateUpdateUserRequest(body) {
  const source = body || {};
  const dto = {};

  if ('nickname' in source) {
    dto.nickname = validateNickname(source.nickname);
  }

  if ('password' in source) {
    dto.password = validatePassword(source.password);
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError(400, NO_FIELDS_MESSAGE);
  }

  return dto;
}

module.exports = { validateUpdateUserRequest };
