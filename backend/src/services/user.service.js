'use strict';

const bcrypt = require('bcrypt');

const { AppError } = require('../utils/app-error');
const { getPool } = require('../config/db.pool');
const { findUserById, updateUserById } = require('../repositories/user.repository');

const BCRYPT_SALT_ROUNDS = 10;
const USER_NOT_FOUND_MESSAGE = '사용자를 찾을 수 없습니다.';

async function getUserForRequest(userId) {
  const user = await findUserById(getPool(), userId);
  if (!user) throw new AppError(404, USER_NOT_FOUND_MESSAGE);
  return user;
}

async function updateUserForUser(userId, dto) {
  const fields = {};
  if ('nickname' in dto) fields.nickname = dto.nickname;
  if ('password' in dto) fields.passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

  const updated = await updateUserById(getPool(), userId, fields);
  if (!updated) throw new AppError(404, USER_NOT_FOUND_MESSAGE);
  return updated;
}

module.exports = { getUserForRequest, updateUserForUser };
