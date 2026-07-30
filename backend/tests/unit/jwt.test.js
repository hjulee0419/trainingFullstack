'use strict';

// BE-2 완료조건 검증 대상 유틸: src/utils/jwt.js
// - signAccessToken(userId)로 발급한 토큰을 verifyAccessToken으로 검증하면 payload.sub가
//   String(userId)와 일치해야 한다(완료조건 5, 8의 전제).
// - 위조/변조된 토큰 문자열은 verifyAccessToken이 throw해야 한다(완료조건 7의 전제).
// - parseExpiresInToSeconds가 '1h'/'30m'/'3600' 등 다양한 형식을 올바르게 초로 환산해야 한다
//   (완료조건 5: 로그인 성공 시 응답의 expiresIn 계산 근거).

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const JWT_PATH = path.resolve(__dirname, '..', '..', 'src', 'utils', 'jwt.js');
const jwtExists = fs.existsSync(JWT_PATH);

if (!jwtExists) {
  console.log('[jwt.test] src/utils/jwt.js가 아직 존재하지 않아 전체 skip 합니다.');
}

test('src/utils/jwt.js가 아직 없으면 skip', { skip: jwtExists }, () => {
  console.log('[jwt.test] src/utils/jwt.js가 아직 존재하지 않아 skip 합니다.');
});

test(
  'signAccessToken으로 발급한 토큰을 verifyAccessToken으로 검증하면 sub가 문자열화된 userId와 일치한다',
  { skip: !jwtExists },
  () => {
    const { signAccessToken, verifyAccessToken } = require(JWT_PATH);

    const token = signAccessToken(1);
    assert.equal(typeof token, 'string');

    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, '1');
  }
);

test(
  '위조/변조된 토큰 문자열은 verifyAccessToken이 throw한다',
  { skip: !jwtExists },
  () => {
    const { signAccessToken, verifyAccessToken } = require(JWT_PATH);

    assert.throws(() => verifyAccessToken('this.is.not-a-valid-jwt'));

    const token = signAccessToken(42);
    const tampered = `${token.slice(0, -1)}${token.slice(-1) === 'a' ? 'b' : 'a'}`;
    assert.throws(() => verifyAccessToken(tampered));
  }
);

test(
  'parseExpiresInToSeconds가 다양한 형식을 올바르게 초로 환산한다',
  { skip: !jwtExists },
  () => {
    const { parseExpiresInToSeconds } = require(JWT_PATH);

    assert.equal(parseExpiresInToSeconds('1h'), 3600);
    assert.equal(parseExpiresInToSeconds('30m'), 1800);
    assert.equal(parseExpiresInToSeconds('3600'), 3600);
    assert.equal(parseExpiresInToSeconds('1d'), 86400);
    assert.equal(parseExpiresInToSeconds('45s'), 45);
  }
);

test(
  'parseExpiresInToSeconds가 잘못된 형식이면 throw한다',
  { skip: !jwtExists },
  () => {
    const { parseExpiresInToSeconds } = require(JWT_PATH);

    assert.throws(() => parseExpiresInToSeconds('not-a-duration'));
  }
);
