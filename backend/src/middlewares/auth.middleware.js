'use strict';

const { AppError } = require('../utils/app-error');

// BE-2에서 JWT 검증 로직으로 대체될 스텁.
// 실제 인증 로직은 이 태스크(BE-1) 범위가 아니다.
function requireAuth(req, res, next) {
  next(new AppError(501, 'Not Implemented — BE-2에서 JWT 검증 구현 예정'));
}

module.exports = { requireAuth };
