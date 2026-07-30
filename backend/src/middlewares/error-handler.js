'use strict';

const { AppError } = require('../utils/app-error');
const { logError } = require('../utils/logger');

// Express 4-인자 에러 핸들링 미들웨어.
// 응답 바디에는 절대 stack을 포함하지 않는다. 스택은 console.error로만 로깅한다.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logError(err, `${req.method} ${req.originalUrl || req.path}`);

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  let message = err.message;
  if (!isAppError && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  const details = isAppError && err.details !== undefined ? err.details : null;

  // 응답 스키마는 swagger.json의 ErrorResponse(statusCode, message)를 따른다.
  // details는 계약에 없는 부가 필드이므로, 값이 있을 때만 포함해 계약을 넘어서는
  // 필드를 불필요하게 노출하지 않는다.
  const body = { statusCode, message };
  if (details !== null) body.details = details;

  res.status(statusCode).json(body);
}

module.exports = { errorHandler };
