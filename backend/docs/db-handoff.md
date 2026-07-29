# DB 인프라 핸드오프 노트

버전: 1.0 / 작성일: 2026-07-29 / 참조: `docs/7-execution-plan.md` DB-1~DB-6 절

## 1. 접속 정보 위치

- 관리자(1회성) 접속 문자열: `backend/.env`의 `POSTGRES_CONNECTION_STRING`(postgres 슈퍼유저, DB/롤 생성 등 1회성 관리 작업 전용, 애플리케이션 런타임에서는 사용하지 않음)
- 애플리케이션 접속 문자열: `backend/.env`의 `DATABASE_URL` (`postgresql://todolist_app:<password>@localhost:5432/todolist_dev`)
  - 실제 값이 담긴 `backend/.env`는 `.gitignore`에 의해 커밋 대상에서 제외된다(`git check-ignore -v backend/.env`로 확인 완료).
  - 커밋되는 템플릿은 `backend/.env.example`(placeholder 값)이다.
- 애플리케이션 전용 DB 롤: `todolist_app` (`NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`), 소유 DB: `todolist_dev`.

## 2. 마이그레이션 실행 명령

도구: [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate) (SQL 파일 방식, `backend/migrations/`).

```bash
npm run migrate:create -- <name>   # migrations/<timestamp>_<name>.sql 스켈레톤 생성 후 backend/migrations/NNNN_설명.sql로 수동 리네이밍
npm run migrate:up                 # 아직 적용되지 않은 마이그레이션 전체 적용
npm run migrate:down                # 최근 적용된 마이그레이션 1개 롤백
npm run migrate:redo                # 최근 마이그레이션 롤백 후 재적용
```

- 파일 네이밍/Up-Down 마커 규칙은 `backend/migrations/README.md`에 문서화되어 있다.
- 현재 적용된 마이그레이션: `0001_create_users.sql`, `0002_create_categories.sql`, `0003_create_todos.sql`.
- `migrate:down`(3회) → `migrate:up` 왕복 실행을 통해 오류 없이 재적용됨을 확인했다.
- 적용 이력은 `pgmigrations` 테이블에 기록된다.

## 3. pg Pool 설정값과 근거

`backend/src/config/db.pool.js`에서 pg.Pool 싱글턴으로 관리한다.

| 옵션 | 값 | 근거 |
| --- | --- | --- |
| `max` | 10 | MVP는 1인 개발·단일 로컬 PostgreSQL 인스턴스 운영을 전제로 한다. `max_connections`(기본 100) 대비 여유를 두면서 동시 요청을 처리할 수 있는 보수적 상한. PRD 6.1의 1000명 동시 접속/p95 800ms 목표는 이후 스케일링 단계(커넥션 풀러, 리드 레플리카 등)에서 재조정한다. |
| `idleTimeoutMillis` | 30000 (30초) | 유휴 커넥션을 오래 점유하지 않아 커넥션 누수를 방지하되, 너무 짧으면 매 요청마다 재연결(핸드셰이크/인증) 비용이 반복 발생해 PRD 6.1의 평균 300ms 목표에 불리하다. |
| `connectionTimeoutMillis` | 2000 (2초) | 커넥션 획득 대기 상한. PRD 6.1 p95 800ms 목표를 고려해 커넥션 대기만으로 예산을 소진하지 않도록 짧게 설정, 장애 시 빠르게 실패(fail fast)하고 에러 응답으로 전환하도록 한다. |

검증: `npm run db:verify-pool` 실행 시 `SELECT 1` 성공 및 `pool.end()` 이후 `totalCount === 0`(커넥션 누수 없음)을 확인했다.

## 4. 인덱스/제약조건 검증

`npm run db:verify-indexes` 실행 결과, `todos` 테이블에 다음 3개 인덱스가 모두 존재하며 선행 컬럼이 `user_id`임을 확인했다(`pg_indexes.indexdef` 기준).

- `idx_todos_user_id_category_id` (user_id, category_id)
- `idx_todos_user_id_is_completed` (user_id, is_completed)
- `idx_todos_user_id_end_date` (user_id, end_date)

`\d todos`/`\d categories`로 아래 제약도 확인했다(`docs/6-erd.md`와 대조 완료).

- `todos`: `ck_todos_end_date_after_start` CHECK (end_date >= start_date), FK `user_id -> users(id) ON DELETE CASCADE`, FK `category_id -> categories(id)`(ON DELETE 미지정=RESTRICT).
- `categories`: `uq_categories_user_id_name` UNIQUE (user_id, name), `uq_categories_user_id_default` 부분 UNIQUE 인덱스 (user_id) WHERE is_default.
- `users`: `uq_users_email` UNIQUE (email).

## 5. 기본 카테고리 정책

**기본(is_default=true) 카테고리 시딩은 마이그레이션이 담당하지 않는다.** 이유: 마이그레이션 시딩은 실행 시점에 존재하는 사용자에게만 적용되고, 이후 가입하는 신규 사용자에게는 적용되지 않기 때문이다.

- 실제 서비스에서 기본 카테고리는 **회원가입 API 트랜잭션**(`BE-2`, `backend/src/services/auth.service.js` 예정)에서 "사용자 insert -> 기본 카테고리 insert"를 하나의 트랜잭션으로 처리한다.
- `backend/scripts/seed.js`도 동일한 순서(사용자 생성 직후 같은 트랜잭션에서 기본 카테고리 생성)를 따르며, 실행 후 `SELECT user_id, count(*) FROM categories WHERE is_default=true GROUP BY user_id HAVING count(*)<>1;` 쿼리로 위반 0건을 확인했다.
- 관련 정책 주석은 `backend/migrations/0002_create_categories.sql` 상단과 `backend/migrations/README.md`에도 명시되어 있다.

## 6. 시드 데이터

`npm run db:seed` 실행 시 더미 사용자 3명(`seed.user1~3@example.com`, bcrypt 해시 비밀번호)과 각자의 기본 카테고리("기본")를 하나의 트랜잭션으로 생성한다. 이메일이 이미 존재하면 해당 사용자는 건너뛴다(재실행 안전).
