'use strict';

// swagger/swagger.json(API 계약)을 Swagger UI로 서빙한다.
// 개발 편의를 위한 문서 라우트이므로 인증(requireAuth)을 요구하지 않는다.

const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const swaggerUi = require('swagger-ui-express');

const SWAGGER_JSON_PATH = path.resolve(__dirname, '..', '..', '..', 'swagger', 'swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(SWAGGER_JSON_PATH, 'utf8'));

const router = Router();

// helmet()의 기본 CSP(script-src 'self')는 swagger-ui-express가 렌더링에 쓰는
// 인라인 <script>를 차단해 UI가 빈 화면으로 보이게 만든다. 전역 보안 정책을
// 약화시키지 않기 위해 이 문서 라우트에서만 CSP를 완화한다.
router.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;"
  );
  next();
});

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
