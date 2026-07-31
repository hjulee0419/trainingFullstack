# TodoList Backend

Node.js + Express + `pg`(ORM 미사용) 기반 REST API. 전체 프로젝트 개요는 [루트 README](../README.md), 아키텍처/레이어링 원칙은 [`docs/4-project-structure.md`](../docs/4-project-structure.md), API 계약은 [`swagger/swagger.json`](../swagger/swagger.json)을 참조하세요.

## 환경변수

`.env.example`을 복사해 `.env`를 만들고 값을 채웁니다. `DATABASE_URL`, `JWT_SECRET`은 필수이며 누락 시 서버가 fail-fast로 즉시 종료됩니다(나머지는 기본값 존재, `src/config/env.js` 참조).

```bash
cp .env.example .env
```

`DATABASE_URL`은 로컬 PostgreSQL 또는 Supabase 커넥션 문자열 중 하나를 사용할 수 있습니다(Supabase를 쓰면 스키마가 이미 마이그레이션되어 있으므로 아래 마이그레이션 단계를 생략해도 됩니다).

## 실행

```bash
npm install
npm run dev     # 개발 서버 (node --watch, 파일 저장 시 자동 재시작). 포트 점유 중이면 predev 훅이 먼저 정리함
npm start       # 프로덕션과 동일한 방식으로 1회 기동 (node src/server.js)
```

기동 확인: `GET /api/v1/health` (DB 커넥션 확인 포함). API 문서: `GET /api/v1/docs` (Swagger UI).

## DB 마이그레이션

`migrations/` 디렉토리 규칙은 [`migrations/README.md`](migrations/README.md) 참조.

```bash
npm run migrate:up              # 미적용 마이그레이션 순서대로 적용
npm run migrate:down            # 가장 최근 마이그레이션 1개 롤백
npm run migrate:redo            # 최근 마이그레이션 롤백 후 재적용
npm run migrate:create -- <name>  # 새 마이그레이션 스켈레톤 생성
```

## 테스트

```bash
npm test   # node:test 기반 단위+통합 테스트, 커버리지 리포트 포함(별도 todolist_test DB 사용, 개발 DB 미오염)
```

기타 점검 스크립트: `npm run db:verify-pool`, `npm run db:verify-indexes`, `npm run db:seed`.

## 배포

Vercel에 배포되어 있습니다: https://lhj-be.vercel.app/api/v1 (DB: Supabase `todolist` 프로젝트). Vercel 프로젝트의 환경변수(`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` 등)는 `.env`와 별개로 Vercel 대시보드에서 관리됩니다 — 프론트엔드 배포 도메인이 바뀌면 `CORS_ORIGIN`도 함께 갱신해야 합니다.
