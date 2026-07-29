'use strict';

// 콘솔 기반 로깅 유틸.

const SENSITIVE_KEY_PATTERN = /password|token|authorization|jwt/i;
const MASKED_VALUE = '***MASKED***';

function requestLogger(req, res, next) {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;
    console.log(
      `[request] ${req.method} ${req.originalUrl || req.path} ${res.statusCode} ${durationMs.toFixed(1)}ms`
    );
  });

  next();
}

function logError(err, context) {
  if (context) {
    console.error(`[error] ${context}:`, err);
  } else {
    console.error('[error]', err);
  }
}

function maskSensitive(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitive(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = MASKED_VALUE;
    } else if (value !== null && typeof value === 'object') {
      result[key] = maskSensitive(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = { requestLogger, logError, maskSensitive };
