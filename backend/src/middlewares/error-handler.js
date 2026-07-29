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

  res.status(statusCode).json({
    status: 'error',
    message,
    details,
  });
}

module.exports = { errorHandler };
