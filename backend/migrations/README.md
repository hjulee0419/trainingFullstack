# Migrations 디렉토리 규칙

이 프로젝트는 [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate)를 사용해 SQL 기반 마이그레이션을 관리한다.

## 네이밍 규칙

- 파일 형식: `<4자리 zero-padded 순번>_<설명>.sql` (예: `0001_create_users.sql`, `0002_create_categories.sql`, `0003_create_todos.sql`)
- 순번은 `node-pg-migrate`의 `--migration-filename-format index` 옵션으로 생성되며 4자리로 zero-padding된다.
- 파일 생성 명령: `npm run migrate:create -- <name>` (예: `npm run migrate:create -- create_users`)
  - 이 명령은 `migrations/` 아래에 up/down 마커가 포함된 `.sql` 스켈레톤 파일을 생성한다.

## 파일 구조

각 마이그레이션 파일은 하나의 `.sql` 파일 안에 아래 두 마커로 Up/Down을 구분한다.

```sql
-- Up Migration
<Up 시 실행할 DDL>

-- Down Migration
<Down 시 실행할 DDL(위 Up의 역순 롤백)>
```

`node-pg-migrate`는 `-- Up Migration` 마커 아래의 SQL을 `migrate:up` 실행 시, `-- Down Migration` 마커 아래의 SQL을 `migrate:down` 실행 시 각각 실행한다.

## 실행 명령

- `npm run migrate:up` — 아직 적용되지 않은 모든 마이그레이션을 순서대로 적용
- `npm run migrate:down` — 가장 최근에 적용된 마이그레이션 1개를 롤백
- `npm run migrate:redo` — 가장 최근 마이그레이션을 롤백 후 재적용
- `npm run migrate:create -- <name>` — 새 마이그레이션 스켈레톤 생성

적용 이력은 `pgmigrations` 테이블(`node-pg-migrate` 자체 관리 테이블)에 기록된다.

## 정책: 기본 카테고리 시딩 제외

사용자별 기본(`is_default=true`) 카테고리 시딩은 이 디렉토리의 마이그레이션에 포함하지 않는다. 마이그레이션 시딩은 실행 시점에 존재하는 사용자에게만 적용되고 이후 가입하는 신규 사용자에게는 적용되지 않기 때문이다. 기본 카테고리 생성은 회원가입 API 트랜잭션(`BE-2`, `services/auth.service.js`)에서 처리한다. 자세한 내용은 `docs/7-execution-plan.md`의 DB-3 절과 `migrations/0002_create_categories.sql` 상단 주석을 참조한다.
