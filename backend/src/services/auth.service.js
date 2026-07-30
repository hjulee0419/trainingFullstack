'use strict';

const bcrypt = require('bcrypt');

const { AppError } = require('../utils/app-error');
const { withTransaction } = require('../utils/with-transaction');
const { getPool } = require('../config/db.pool');
const env = require('../config/env');
const { signAccessToken, parseExpiresInToSeconds } = require('../utils/jwt');
const { insertUser, findUserByEmail } = require('../repositories/user.repository');
const { insertCategory } = require('../repositories/category.repository');

const BCRYPT_SALT_ROUNDS = 10;
const DUPLICATE_EMAIL_MESSAGE = '이미 사용 중인 이메일입니다.';
const INVALID_CREDENTIALS_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';
const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

async function signup({ email, password, nickname }) {
  const existing = await findUserByEmail(getPool(), email);
  if (existing) throw new AppError(409, DUPLICATE_EMAIL_MESSAGE);

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    return await withTransaction(getPool(), async (client) => {
      const user = await insertUser(client, { email, passwordHash, nickname });
      await insertCategory(client, { userId: user.id, name: '기본', isDefault: true });
      return user;
    });
  } catch (err) {
    if (err.code === POSTGRES_UNIQUE_VIOLATION_CODE) throw new AppError(409, DUPLICATE_EMAIL_MESSAGE);
    throw err;
  }
}

async function login({ email, password }) {
  const user = await findUserByEmail(getPool(), email);
  if (!user) throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);

  const accessToken = signAccessToken(user.id);

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: parseExpiresInToSeconds(env.JWT_EXPIRES_IN),
    user: { id: user.id, email: user.email, nickname: user.nickname, createdAt: user.createdAt },
  };
}

module.exports = { signup, login };
