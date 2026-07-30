# TodoList 실행계획 (DB / 백엔드 / 프론트엔드 Task 분할)

버전: 1.0 / 작성일: 2026-07-29 / 작성자: 실행계획 수립(postgres-pro/backend-developer/frontend-developer 서브에이전트 종합)

## 0. 문서 개요

`docs/1-domain-definition.md` ~ `docs/6-erd.md`, `database/schema.sql`을 근거로, 1인 개발·2일 MVP 일정 하에서 **데이터베이스(DB) / 백엔드(BE) / 프론트엔드(FE)** 3개 영역의 작업을 관리 가능한 Task로 분할하고, 영역 간 의존성을 명시한 실행계획이다. 각 서브에이전트(postgres-pro, backend-developer, frontend-developer)가 담당 영역을 병렬로 분석해 도출했다.

## 1. 전체 Critical Path (영역 간 교차 의존성)

```
DB-1(DB 인스턴스) → DB-2(마이그레이션 러너) → DB-3(스키마 적용+기본카테고리 정책 확정)
                                                        │
                                                        ▼
BE-1(프로젝트 세팅) ────────────────────────────────▶ BE-2(인증 API, 회원가입 시 기본카테고리 생성)
                                                        │
                                                        ▼
                                                   BE-3(카테고리 API) → BE-4(할일 CRUD) → BE-5(목록조회/필터)
                                                        │                                      │
                                                        ▼                                      ▼
FE-1(프로젝트 세팅) → FE-2(인증 화면) → FE-3(카테고리 화면) ──────────────────────▶ FE-4(할일 목록 화면) → FE-5(등록/수정) → FE-6(삭제/완료)
```

- **최우선 병목**: `DB-1→DB-2→DB-3`이 Day 1 오전 안에 끝나야 `BE-2`(회원가입 시 기본 카테고리 생성 트랜잭션)가 실제 DB로 검증 가능하다.
- **두 번째 병목**: `BE-2→BE-3→BE-4→BE-5`(Must API 전체)가 Day 1 종료(M1) 목표다. 이게 늦어지면 FE-4 이후 전 화면이 Mock 상태로 남는다.
- **프론트는 상당 부분 선행 가능**: FE는 PRD FR 스펙과 ERD 컬럼 정의만으로 Mock 응답 기반 개발을 먼저 시작할 수 있어, DB/BE 완료를 마냥 기다리지 않는다. 단 실제 통합 검증은 각 BE Task 완료 후에만 가능하다(아래 Task별 의존성 참조).
- **Should/Could 항목**(DB-6, BE-7, BE-8 일부, FE-7, FE-10)은 일정 지연 시 가장 먼저 축소 대상이다.

---

## 2. 데이터베이스(DB) 영역

> 담당 판단: `database/schema.sql`은 이미 초안이 존재하며, 기본 카테고리 시딩은 **마이그레이션 시딩이 아니라 회원가입 트랜잭션(BE)에서 처리**하는 것이 도메인 규칙(모든 사용자가 암묵적으로 기본 카테고리 보유)에 부합한다는 것이 핵심 판단이다.

### DB-1. 로컬 PostgreSQL 17 인스턴스 준비 및 접속 확인
**작업 내용**
- 로컬 개발용 PostgreSQL 17 준비(기존 설치 또는 Docker `postgres:17`), `todolist_dev` DB 생성, 애플리케이션 전용 사용자 발급
- 접속 정보를 `.env.example`(백엔드) 포맷으로 정리

**의존성**: 없음 (착수 시작점)

**완료 조건**
- [x] `psql -h localhost -U <app_user> -d todolist_dev -c '\conninfo'` 접속 성공
- [x] `SELECT version();` 결과에 PostgreSQL 17.x 표기 확인
- [x] `.env.example`에 DB 접속 키가 placeholder로 커밋, 실제 `.env`는 `.gitignore` 포함

### DB-2. 마이그레이션 러너 및 `migrations/` 디렉토리 구성
**작업 내용**
- `migrations/` 디렉토리 생성, 경량 마이그레이션 러너(`node-pg-migrate` 등) 도입, `migrate:up`/`migrate:down` 스크립트 추가
- 파일 네이밍(`001_create_users.sql` 등) 및 up/down 구조 확정

**의존성**: DB-1 완료 필요. BE-1(`package.json` 생성)과 상호 조율 필요 — **BE-1이 DB-2를 기다림**

**완료 조건**
- [x] `migrations/` 디렉토리 및 네이밍 규칙 문서화(README/주석)
- [x] `npm run migrate:up`/`migrate:down`이 빈 상태에서 오류 없이 실행
- [x] 러너의 자체 관리 테이블(`pgmigrations` 등) 생성을 `\dt`로 확인

### DB-3. 스키마 마이그레이션 작성 및 적용 (schema.sql → 001~003 분할)
**작업 내용**
- `schema.sql`을 `001_create_users.sql`/`002_create_categories.sql`/`003_create_todos.sql`(각 up/down)로 분할
- **기본 카테고리 시딩은 별도 마이그레이션 파일로 만들지 않고, 회원가입 API 트랜잭션 로직으로 구현한다는 정책을 명시**(이유: 시딩 스크립트는 마이그레이션 시점 기존 사용자에게만 적용되고 이후 가입자에게는 적용 안 됨)
- 각 파일 down 스크립트 작성, `migrate:up`→`down`→`up` 왕복 검증

**의존성**: DB-1, DB-2 완료 필요. **BE-3(회원가입/로그인 API 구현)이 이 Task의 완료(기본 카테고리 정책 확정)를 기다림**

**완료 조건**
- [x] `migrations/001~003_*.sql`(up/down) 존재 (실제 파일명은 node-pg-migrate index 포맷 4자리: `0001~0003_*.sql`)
- [x] `migrate:up` 후 `\d`로 `users`/`categories`/`todos` 3개 테이블 존재 확인
- [x] `\d todos`로 `ck_todos_end_date_after_start` CHECK 및 3개 인덱스 존재 확인
- [x] `\d categories`로 `uq_categories_user_id_name`, `uq_categories_user_id_default`(부분 유니크) 존재 확인
- [x] `migrate:down`→`migrate:up` 재실행 오류 없이 성공(왕복 가능 확인)
- [x] "기본 카테고리는 회원가입 트랜잭션에서 생성"이라는 정책이 커밋 메시지/주석으로 명시되어 BE가 참조 가능

### DB-4. pg Pool 커넥션 설정값 확정 및 검증
**작업 내용**
- `max`, `idleTimeoutMillis`, `connectionTimeoutMillis` 등 확정(PRD 6.1 반영), 근거 문서화
- 임시 스크립트로 Pool 생성 후 `SELECT 1` 검증

**의존성**: DB-1 완료 필요. DB-2/DB-3과 병렬 가능. **BE-2(백엔드 pg Pool 세팅)가 DB-4를 기다림**

**완료 조건**
- [x] `max`/`idleTimeoutMillis`/`connectionTimeoutMillis` 값이 문서화됨
- [x] 검증 스크립트에서 `SELECT 1` 성공 응답
- [x] `pool.end()` 시 커넥션 정상 반환/종료 확인(누수 없음)

### DB-5. 인덱스 및 제약조건 존재 검증
**작업 내용**
- DB-3에서 적용된 인덱스/제약이 실제 쿼리 패턴(FR-5)에 부합하는지 `pg_indexes` 조회로 확인(EXPLAIN 분석은 시간상 생략)

**의존성**: DB-3 완료 필요. Critical path 아님(시간 없으면 축소 가능)

**완료 조건**
- [x] `pg_indexes` 조회 결과에 `todos`용 인덱스 3개 모두 표시
- [x] 각 인덱스 선행 컬럼이 `user_id`임을 `indexdef`로 확인
- [x] `\d+` 출력과 `docs/6-erd.md`의 제약조건 대조 완료

### DB-6. (여력 시) 시드/테스트 데이터 스크립트 및 핸드오프 노트
**작업 내용**
- 개발/QA용 최소 시드 데이터 작성(기본 카테고리는 회원가입과 동일 순서로 생성)
- 접속정보/마이그레이션 실행법/Pool 설정값/기본 카테고리 정책을 커밋 메시지 등으로 인계

**의존성**: DB-3, DB-4 완료 필요. **BE-3~BE-5가 참조하나 필수는 아님(스킵 가능)**

**완료 조건**
- [x] 시드 스크립트 실행 후 `users` row 존재 확인
- [x] 시드된 각 사용자에 `is_default=true` 카테고리가 정확히 1개씩 존재(그룹별 count=1 쿼리로 확인)
- [x] 핸드오프 노트에 접속정보/마이그레이션 명령/Pool 값/기본 카테고리 정책 모두 언급

---

## 3. 백엔드(BE) 영역

### BE-1. 프로젝트 초기 세팅 및 공통 인프라
**작업 내용**
- `backend/src/{config,routes,controllers,services,repositories,domain,middlewares,utils,validators}` 구조 생성
- Express 앱 조립, `helmet`, CORS(프론트 오리진만 허용)
- `config/env.js`(fail fast), `config/db.pool.js`(pg.Pool)
- 공통 미들웨어(`error-handler`, `async-handler`, `auth.middleware` 뼈대), `utils/{app-error, case-mapper, with-transaction, logger}`
- `.env.example`, health check(`GET /api/v1/health`)

**의존성**: DB-1(접속정보) 필요. DB-2와 `package.json`/마이그레이션 스크립트 위치 상호 조율.

**완료 조건**
- [x] `node src/server.js` 정상 기동, 포트 로그 출력
- [x] 필수 환경변수 누락 시 기동 즉시 실패(fail fast) + 명확한 에러 로그
- [x] `GET /api/v1/health` 200 응답 및 DB 커넥션 획득 성공 확인
- [x] 임시 예외 라우트 호출 시 error-handler가 일관된 JSON 에러 포맷 응답, stack trace 미노출
- [x] 허용되지 않은 Origin 요청 CORS 차단 확인

### BE-2. 인증 API (FR-1 회원가입, FR-2 로그인/JWT)
**작업 내용**
- `auth.{repository,service,controller,routes}.js`, `validators/auth.schema.js`
- 회원가입 성공 시 트랜잭션으로 `users` insert + `is_default=true` 카테고리 자동 생성(DB-3 정책 반영)
- 로그인: bcrypt 비교, JWT 발급(1~2시간), 실패 시 통합 에러 메시지
- `auth.middleware.js` 완성(JWT 검증, `req.user` 주입, 401)

**의존성**: BE-1, DB-3(스키마 적용 완료) 필요, DB-4(Pool 설정값) 필요.

**완료 조건**
- [x] 회원가입 성공 시 201 + `users`/`categories`(`is_default=true`) row 동시 생성 확인
- [x] 이메일 중복 시 409/400, 추가 row 생성 안 됨
- [x] 필수값/형식 오류 시 400
- [x] 비밀번호가 bcrypt 해시로 저장됨을 DB 조회로 확인
- [x] 로그인 성공 시 200 + JWT 반환
- [x] 잘못된 이메일/비밀번호 모두 동일 메시지로 401(계정 존재 여부 비노출)
- [x] 토큰 없이/위조 토큰으로 보호 라우트 호출 시 401
- [x] 정상 JWT로 `req.user.id` 주입 확인

### BE-3. 카테고리 API (FR-8 Must / FR-9 Should)
**작업 내용**
- `category.{repository,service,controller,routes}.js`, `validators/category.schema.js`
- 삭제 시 `with-transaction.js`로 "소속 todos 이관 → 카테고리 삭제" 원자적 처리
- 기본 카테고리 수정/삭제 명시적 차단(E-4), 모든 쿼리에 소유자 조건 필수

**의존성**: BE-2 완료 필요.

**완료 조건**
- [x] 카테고리 생성 시 201 + row 생성(`is_default=false`)
- [x] 동일 이름 재생성 시 409
- [x] 이름 수정 시 200 + DB 반영
- [x] 기본 카테고리 수정/삭제 요청 시 400/403으로 거부 (구현은 400으로 통일 — 프로젝트 전체가 403을 쓰지 않는 컨벤션에 따름)
- [x] 삭제 시 소속 todos의 `category_id`가 기본 카테고리로 이관되고 카테고리 row 삭제됨(트랜잭션 원자성 오류 주입 테스트 포함)
- [x] 타 사용자 소유 카테고리 접근 시 404
- [x] 미인증 요청 401

### BE-4. 할일 CRUD API (FR-4, FR-6, FR-7)
**작업 내용**
- `todo.{repository,service,controller,routes}.js`, `validators/todo.schema.js`
- `end_date >= start_date` 애플리케이션 사전 검증, 카테고리 미지정 시 기본 카테고리 자동 적용
- 완료 여부(Boolean) 토글, 소유자 검증 전 쿼리 적용

**의존성**: BE-2, BE-3 완료 필요.

**완료 조건**
- [x] 등록 성공 시 201 + row 생성
- [x] 카테고리 미지정 시 기본 카테고리 자동 적용 확인
- [x] 종료일자<시작일자 시 400 및 미저장(E-1)
- [x] 수정 시 200 + DB 반영, `updated_at` 갱신
- [x] 삭제 시 204/200 + row 삭제
- [x] 타 사용자 소유 todo 접근 시 404(FR-10)
- [x] 존재하지 않는 category_id 등록 시 400/404

### BE-5. 할일 목록 조회 API — 상태 파생 + 필터 + 페이지네이션 (FR-5)
**작업 내용**
- `domain/todo-status.js` 순수 함수(4개 상태 계산, 서버 UTC 기준)
- 목록 쿼리에 `category_id`/`is_completed`/날짜 조건 AND 결합, `LIMIT/OFFSET`
- 응답에 파생 status 및 페이지네이션 메타 포함

**의존성**: BE-4 완료 필요.

**완료 조건**
- [x] 본인 소유 todo만 반환 확인
- [x] categoryId+status 동시 지정 시 AND 필터링 정확히 동작
- [x] 완료 처리된 todo는 기한초과와 무관하게 'completed' 반환(E-6)
- [x] 경계값(시작일=오늘→진행중, 종료일=오늘→진행중) 테스트 통과
- [x] 응답에 페이지네이션 메타 포함, limit/page 동작 확인
- [x] 필터 미지정 시 전체 목록(페이지네이션 적용) 반환

### BE-6. 접근 제어 통합 점검 + 핵심 로직 단위 테스트
**작업 내용**
- 전 엔드포인트의 `user_id` 조건 적용 여부 코드 리뷰
- `tests/unit/{todo-status, date-validation, ownership}.test.js` 작성, (선택) `tests/integration/happy-path.test.js`

**의존성**: BE-2~BE-5 완료 필요.

**완료 조건**
- [x] `npm test` 전체 통과
- [x] todo-status 테스트에 4개 상태 경계값 케이스 모두 포함 및 통과
- [x] Repository 쿼리 전수에 `user_id` 조건 존재 확인(누락 시 즉시 수정) — 코드 리뷰 결과 위반 없음, `ownership.test.js`로 회귀 방지 자동화
- [x] (선택) happy-path 통합 테스트 통과

### BE-7. (Should — 여력 시) 계정 정보 수정 API (FR-3)
**작업 내용**: `user.repository.js` update, 닉네임/비밀번호 변경 로직, `PATCH /api/v1/users/me`

**의존성**: BE-2 완료 필요. 일정 지연 시 최우선 축소 대상.

**완료 조건**
- [x] 닉네임 변경 200 + DB 반영
- [x] 비밀번호 최소 길이 미달 시 400
- [x] 비밀번호 변경 후 신규 비밀번호로만 재로그인 성공
- [x] 미인증 요청 401

### BE-8. (Should — 여력 시) 완료일시 자동 기록(FR-11) + 배포 준비
**작업 내용**: 완료 토글 시 `completed_at` 자동 기록/초기화(FR-11), 배포용 설정(`NODE_ENV=production`, graceful shutdown, CORS 최종 점검)

**의존성**: FR-11은 BE-4 필요. 배포 준비는 BE-1~BE-6(Must 전체) 완료 후. DB-3(운영/스테이징 마이그레이션 적용) 필요.

**완료 조건**
- [x] 완료 전환 시 `completed_at` 기록, 완료 해제 시 NULL 초기화 (BE-4에서 선반영, todo.test.js로 검증)
- [x] 목록 응답에 `completedAt` 포함
- [x] 프로덕션 모드에서 stack trace 미노출 (BE-1에서 선반영, error-handler.test.js로 검증)
- [x] 배포 대상 환경에서 정상 기동 및 health check 통과 (실제 로컬 기동 + `GET /api/v1/health` 확인, health.test.js)
- [x] SIGTERM 시 정상 종료(DB 커넥션 정리) 확인 (`server.js`에 graceful shutdown 추가, graceful-shutdown.test.js로 검증)

---

## 4. 프론트엔드(FE) 영역

### FE-1. 프로젝트 초기 세팅 및 공통 인프라
**작업 내용**
- Vite+React 19+TS, `tsconfig`(strict, `@/` alias), React Router, Zustand/TanStack Query 셋업
- `api/client.ts`(인터셉터 골격), `.env`(`VITE_API_BASE_URL`)
- `shared/layout/{AppLayout, ProtectedRoute}`, `shared/components/*` 뼈대, ErrorBoundary, `styles/globals.css`, Vitest+RTL

**의존성**: 없음(최우선 착수, 백엔드 무관)

**완료 조건**
- [x] `npm run dev` 정상 기동, `tsc --noEmit`/`eslint` 통과
- [x] `QueryClientProvider`/`BrowserRouter` 구성 및 라우팅 확인
- [x] 요청 인터셉터의 토큰 자동 부착 단위 확인
- [x] `ProtectedRoute`가 미인증 시 `/login`으로 리다이렉트
- [x] 공통 컴포넌트(Loading/Error/Empty) 렌더링 확인
- [x] Vitest 샘플 테스트 통과

### FE-2. 인증 화면 (FR-1, FR-2)
**작업 내용**: `authApi`, `useSignupMutation`/`useLoginMutation`, `useAuthStore`(localStorage 캡슐화), `LoginForm`/`SignupForm`, `routes/auth/*`

**의존성**: FE-1 완료 필요. **BE-2(인증 API) 완성 필요** — 스펙 합의 시 Mock으로 선행 가능.

**완료 조건**
- [x] 회원가입 폼 클라이언트 측 검증(이메일 형식/필수값) 동작
- [x] 로그인 성공 시 토큰 저장 + `/todos` 리다이렉트
- [x] 로그인 실패 시 일반화 메시지 표시(E-8)
- [x] 로그아웃 시 토큰 삭제 + `/login` 이동
- [x] 401 응답 시 자동 로그아웃+리다이렉트(FE-1 인터셉터 연동)

### FE-3. 카테고리 관리 화면 (FR-8 Must / FR-9 Should)
**작업 내용**: `categoryApi`, CRUD 훅, `CategoryList`/`CategoryForm`, 기본 카테고리 수정/삭제 UI 비노출, 삭제 컨펌+이관 안내 문구

**의존성**: FE-1, FE-2 필요. **BE-3(카테고리 API) 필요** — Mock 선행 가능. FE-4/FE-5보다 먼저 착수 권장.

**완료 조건**
- [x] 생성 시 목록 즉시 반영
- [x] 기본 카테고리에 수정/삭제 UI 미노출
- [x] 삭제 컨펌 다이얼로그 및 API 호출 확인
- [x] 이름 수정 후 목록 반영
- [x] (Should) 여력 없으면 생성만으로 축소 가능 (전체 구현됨, 해당 없음)

### FE-4. 할일 목록 화면 (FR-5)
**작업 내용**: `todoApi.getTodos`, `useTodosQuery`, `useTodoFilterStore`, `TodoFilterBar`(AND 필터), `TodoList`/`TodoListItem`/`TodoStatusBadge`, `buildTodoQueryParams`, 최소 페이지네이션 UI

**의존성**: FE-1, FE-2, FE-3 필요. **BE-5(목록 조회 API) 필요** — 응답 스키마 확정 시 Mock 선행 가능. **이후 FE-5/FE-6이 재사용하는 병목 Task, 최우선 진행**

**완료 조건**
- [x] 카테고리+상태 동시 선택 시 AND 필터링 확인
- [x] 필터 상태(Zustand) 변경 시 쿼리 재요청 확인
- [x] 완료 항목은 기한초과 무관 '완료' 뱃지(E-6)
- [x] 빈 목록/로딩/에러 각각 공통 컴포넌트 노출
- [x] 페이지네이션(개수 제한) UI 동작

### FE-5. 할일 등록/수정 화면 (FR-4, FR-6)
**작업 내용**: `TodoForm`(공용), `DateRangePicker`, `validateTodoForm` 순수 함수, 생성/수정 mutation, 제출 성공 시 목록 이동+invalidate

**의존성**: FE-1~FE-4 필요. **BE-4(등록/수정 API) 필요** — Mock 선행 가능.

**완료 조건**
- [ ] 종료일자<시작일자 시 클라이언트 즉시 차단+에러 표시(E-1)
- [ ] 카테고리 미지정 등록 정상 동작(E-2)
- [ ] 성공 시 목록 이동 및 반영
- [ ] 수정 화면 진입 시 기존 값 프리필
- [ ] 404 응답(타 소유) 시 "존재하지 않는 항목입니다" 안내(E-5)

### FE-6. 할일 삭제 및 완료 처리 UI (FR-7, FR-6 일부, FR-11 Should)
**작업 내용**: 삭제 컨펌 다이얼로그, 완료 토글, 완료일시 표시(FR-11)

**의존성**: FE-4, FE-5 완료 필요. **BE-4/BE-8(삭제/완료 API) 필요** — Mock 선행 가능.

**완료 조건**
- [ ] 삭제 컨펌 확인 시에만 API 호출
- [ ] 취소 시 삭제 미실행
- [ ] 완료 체크 시 뱃지 즉시 갱신, 기한초과 무관
- [ ] (Should) 완료일시 표시 — 여력 없으면 생략 가능

### FE-7. (Should — 여력 시) 계정 정보 수정 화면 (FR-3)
**작업 내용**: 닉네임/비밀번호 변경 폼, 클라이언트 정책 검증

**의존성**: FE-1, FE-2 필요. **BE-7 필요** — Mock 선행 가능. 일정 지연 시 최우선 스킵 대상.

**완료 조건**
- [ ] 닉네임 변경 즉시 반영
- [ ] 비밀번호 최소 길이 미달 시 에러 표시
- [ ] 성공/실패 피드백 노출

### FE-8. 반응형 스타일 점검 및 공통 UI 마무리
**작업 내용**: 모바일/태블릿/PC 레이아웃 점검, 공통 UI 일관 적용, 시나리오(3-user-scenario.md) 수동 검증

**의존성**: FE-2~FE-7 대부분 완료 후. 백엔드 의존 없음.

**완료 조건**
- [ ] 375px 폭에서 가로 스크롤 없이 정상 렌더링
- [ ] 태블릿/PC 폭 레이아웃 정상
- [ ] P1/P2/P3 정상 흐름 시나리오 수동 완주
- [ ] E-1, E-2, E-5, E-7, E-8 경계 시나리오 화면 동작 확인

### FE-9. 핵심 로직 단위 테스트
**작업 내용**: `deriveTodoStatus`, `validateTodoForm` Vitest 단위 테스트(경계값 포함)

**의존성**: FE-4/FE-5와 병행 또는 직후. 백엔드 의존 없음.

**완료 조건**
- [ ] 시작전/진행중/기한초과/완료(기한 무관) 4개 케이스 테스트 통과
- [ ] 날짜 유효성 검증(경계 포함) 테스트 통과
- [ ] `npm run test` 전체 통과

### FE-10. (Could — 여력 시) 카테고리별 개수 표시 및 정렬 (FR-12, FR-13)
**작업 내용**: 카테고리별 할일 개수 표시, 목록 정렬 옵션

**의존성**: FE-3, FE-4 필요. BE 미지원 시 클라이언트 사이드로 임시 구현 가능.

**완료 조건**
- [ ] (구현 시) 카테고리별 개수 표시 확인
- [ ] (구현 시) 정렬 옵션 변경 시 순서 즉시 반영
- [ ] 미착수 시 FE-4 기본 정렬(등록일시 역순)로 대체됨을 확인

---

## 5. 우선순위 요약

| 영역 | Critical Path | Should/Could(축소 우선순위) |
|---|---|---|
| DB | DB-1 → DB-2 → DB-3 (Day1 오전) | DB-5, DB-6 |
| BE | BE-1 → BE-2 → BE-3 → BE-4 → BE-5 (Day1 종료=M1 목표) | BE-7 → BE-8 순으로 축소 |
| FE | FE-1 → FE-2 → FE-3 → FE-4 → FE-5 → FE-6 (Day2 중반=M2 목표) | FE-7 → FE-10 순으로 축소 |

지연 발생 시 축소 우선순위: **FE-10 → FE-7 → BE-7 → DB-6 → FE-6의 완료일시 표시 → BE-8의 FR-11 → FE-3/BE-3의 수정·삭제(FR-9)** 순으로 Should/Could 항목부터 컷하고, Must 항목(회원가입~할일 CRUD~필터 조회)만은 반드시 유지한다.
