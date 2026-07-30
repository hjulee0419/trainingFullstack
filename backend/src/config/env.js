'use strict';

// 필수 환경변수를 fail-fast로 검증한다.
// 애플리케이션(서버/스크립트) 어디에서든 이 모듈을 가장 먼저 require해서
// 환경변수 누락 시 즉시 프로세스를 종료시키고 명확한 원인을 콘솔에 남긴다.

const path = require('path');

// DOTENV_PATH: 테스트에서 격리된(존재하지 않는) .env 경로를 주입해 fail-fast 분기를
// 검증할 수 있도록 하는 override. 지정하지 않으면 항상 backend/.env를 절대경로로 로드한다.
require('dotenv').config({ path: process.env.DOTENV_PATH || path.resolve(__dirname, '../../.env') });

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];

const OPTIONAL_ENV_VARS_WITH_DEFAULTS = {
  DB_POOL_MAX: '10',
  DB_POOL_IDLE_TIMEOUT_MS: '30000',
  DB_POOL_CONNECTION_TIMEOUT_MS: '2000',
  PORT: '3000',
  NODE_ENV: 'development',
  CORS_ORIGIN: 'http://localhost:5173',
  JWT_EXPIRES_IN: '1h',
};

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || process.env[key].trim() === '');

  if (missing.length > 0) {
    console.error(
      `[env] 필수 환경변수가 누락되었습니다: ${missing.join(', ')}. ` +
        'backend/.env 파일을 확인하거나 backend/.env.example을 참고해 값을 채워주세요.'
    );
    process.exit(1);
  }

  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS_WITH_DEFAULTS)) {
    if (!process.env[key] || process.env[key].trim() === '') {
      process.env[key] = defaultValue;
    }
  }
}

validateEnv();

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_POOL_MAX: Number(process.env.DB_POOL_MAX),
  DB_POOL_IDLE_TIMEOUT_MS: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS),
  DB_POOL_CONNECTION_TIMEOUT_MS: Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS),
  PORT: Number(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
};

module.exports = env;
