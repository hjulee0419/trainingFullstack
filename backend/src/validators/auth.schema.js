'use strict';

const { AppError } = require('../utils/app-error');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateSignupRequest(body) {
  const { email, password, nickname } = body || {};

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    throw new AppError(400, '올바른 이메일 형식이 아닙니다.');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
  }

  if (typeof nickname !== 'string' || nickname.trim() === '') {
    throw new AppError(400, '닉네임을 입력해주세요.');
  }

  return { email: email.trim(), password, nickname: nickname.trim() };
}

function validateLoginRequest(body) {
  const { email, password } = body || {};

  if (typeof email !== 'string' || email.trim() === '') {
    throw new AppError(400, '이메일을 입력해주세요.');
  }

  if (typeof password !== 'string' || password === '') {
    throw new AppError(400, '비밀번호를 입력해주세요.');
  }

  return { email, password };
}

module.exports = { validateSignupRequest, validateLoginRequest };
