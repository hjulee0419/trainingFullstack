'use strict';

// 비동기 라우트 핸들러의 rejected promise를 자동으로 next(err)로 전달하는 래퍼.

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
