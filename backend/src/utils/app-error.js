'use strict';

class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace(this, AppError);
  }
}

module.exports = { AppError };
