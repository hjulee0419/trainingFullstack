'use strict';

const { AppError } = require('../utils/app-error');
const { verifyAccessToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, '인증이 필요합니다.'));
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: Number(payload.sub) };
    next();
  } catch (err) {
    next(new AppError(401, '유효하지 않은 토큰입니다.'));
  }
}

module.exports = { requireAuth };
