'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const UNIT_TO_SECONDS = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

function parseExpiresInToSeconds(expiresIn) {
  const match = /^(\d+)(s|m|h|d)?$/.exec(String(expiresIn));
  if (!match) {
    throw new Error(`[jwt] 잘못된 expiresIn 형식입니다: ${expiresIn}`);
  }
  const [, amount, unit] = match;
  const multiplier = unit ? UNIT_TO_SECONDS[unit] : 1;
  return Number(amount) * multiplier;
}

module.exports = { signAccessToken, verifyAccessToken, parseExpiresInToSeconds };
