# TodoList 프로젝트 구조 설계 원칙

버전: 1.0 / 작성일: 2026-07-29 / 작성자: Backend/Frontend Developer 서브에이전트 종합

## 1. 문서 개요

### 1.1 목적
본 문서는 `1-domain-definition.md`(도메인 정의서), `2-PRD.md`(제품 요구사항), `3-user-scenario.md`(사용자 시나리오)에서 정의한 도메인·기능·제약사항을 실제 코드로 옮기기 위한 **프로젝트 구조 설계 원칙**을 정의한다. 1인 개발·2일 일정이라는 제약 하에서, "무엇을 어디에 두어야 하는가"에 대한 판단을 매번 새로 하지 않도록 사전에 규칙을 확정하는 것을 목표로 한다.

### 1.2 참조 문서
- `1-domain-definition.md` (도메인 정의서 v1.1)
- `2-PRD.md` (PRD v1.2 — 확정 기술 스택, FR-1~FR-13, 비기능 요구사항)
- `3-user-scenario.md` (사용자 시나리오)

### 1.3 적용 범위
확정된 기술 스택(대안 비교 없이 그대로 적용):
- 프론트엔드: React 19 + TypeScript + Zustand + TanStack Query
- 백엔드: Node.js + JavaScript + Express + pg 라이브러리 (Prisma 등 ORM 미사용)
- 데이터베이스: PostgreSQL 17

## 2. 모든 스택 공통 최상위 원칙

기술 스택이 다르더라도 프론트엔드/백엔드 전체에 동일하게 적용되는 원칙이다. 이하 3~6장의 세부 규칙은 모두 이 원칙에서 파생된다.

1. **단방향 의존성 원칙**: 모든 레이어 의존은 "UI/진입점 → 로직 → 데이터 접근"의 단방향으로만 흐른다. 하위 레이어가 상위 레이어를 참조하는 역방향 의존은 프론트/백엔드 모두 금지한다.
2. **관심사 분리 원칙**: "입출력 처리(HTTP 요청/응답, 화면 렌더링)"와 "비즈니스 로직(상태 파생 계산, 유효성 검증, 소유자 검증)"과 "데이터 접근(SQL 쿼리, API 호출)"을 서로 다른 파일/모듈로 물리적으로 분리한다. 한 파일에서 세 가지를 동시에 하지 않는다.
3. **파생 로직의 순수 함수화**: 할일 상태(시작전/진행중/완료/기한초과) 계산처럼 "저장값이 아니라 매번 계산되는 값"은 프론트/백엔드 각각에서 부수효과 없는 순수 함수로 분리한다(백엔드 `domain/todo-status.js`, 프론트 `features/todos/lib/deriveTodoStatus.ts`). 이 두 구현은 같은 도메인 규칙(도메인 정의서 4장)을 따르되, 프론트는 표시용, 백엔드는 필터링/응답용으로 각자 독립 구현한다(공유 패키지화는 2일 일정상 범위 밖).
4. **기능(도메인) 우선 조직화**: `auth / category / todo` 3개 핵심 도메인을 기준으로 코드를 1차 분리한다. 타입(components, hooks, api 등)별 전역 분리보다 기능별 응집도를 우선한다 — 도메인이 적고 일정이 짧을수록 "관련 파일을 한 곳에서 찾을 수 있는" 구조가 유리하다.
5. **점진적 공통화(Rule of 2)**: 처음부터 공통 모듈을 과설계하지 않는다. 동일 로직/컴포넌트가 2곳 이상에서 필요해지는 시점에만 `shared/`, `common/` 등으로 승격한다.
6. **비밀정보·환경설정의 코드 분리**: JWT 시크릿, DB 접속정보, API 베이스 URL 등 환경별로 달라지는 값은 코드에 하드코딩하지 않고 `.env` + `.env.example` 조합으로 관리하며, `.env`는 버전관리에서 제외한다.
7. **404 우선 에러 원칙**: 소유자 검증 실패, 인증되지 않은 리소스 접근은 프론트/백엔드 모두 "존재하지 않는 것처럼" 취급하는 도메인 규칙(도메인 정의서 규칙 4)을 각 레이어에서 일관되게 구현한다 — 백엔드는 404 응답, 프론트는 "존재하지 않는 항목입니다" 형태의 안내로 대응한다.
8. **일정 우선순위에 따른 품질 투자 원칙**: PRD의 Must/Should/Could 우선순위와 동일한 원칙을 코드 품질 투자에도 적용한다 — 핵심 도메인 로직(상태 계산, 유효성 검증, 소유자 검증)에는 테스트를 반드시 투자하고, 그 외 영역은 수동 확인으로 대체한다(6장 참조).

## 3. 의존성/레이어 원칙

### 3.1 백엔드 레이어 구조
```
Router → Controller → Service → Repository(Query) → DB(pg Pool)
```
- **Router**: URL/HTTP 메서드 매핑과 인증 미들웨어 부착만 담당. 로직 없음.
- **Controller**: `req/res` 파싱, 입력 검증 호출, Service 호출, 응답 포맷(status code + JSON) 담당. 비즈니스 로직 없음.
- **Service**: 비즈니스 로직 전담(상태 파생 계산, 소유자 검증, 카테고리 삭제 시 할일 이관). DB는 직접 접근하지 않고 Repository만 호출.
- **Repository**: 모든 raw SQL을 이 레이어에만 작성. `pg` Pool/Client 사용을 이 레이어로 완전히 캡슐화. Controller/Service에서 SQL 직접 작성 금지.
- **트랜잭션 위치**: Service에서 시작/커밋/롤백을 오케스트레이션하되, 실제 커넥션은 `withTransaction(async (client) => {...})` 헬퍼로 획득해 여러 Repository 함수에 동일 `client`를 전달함으로써 원자성을 보장한다(카테고리 삭제 → 할일 이관에 필수 적용).
- **소유자 기반 접근 제어**: Repository 쿼리 자체에 `WHERE id = $1 AND user_id = $2` 조건을 항상 포함해 DB 레벨에서 1차 필터링하고, 결과가 없으면 Service/Controller에서 무조건 404로 응답한다(403 사용 금지 — 리소스 존재 여부 비노출).

### 3.2 프론트엔드 레이어 구조
```
components (UI)
    ↓
hooks (도메인 로직: useXxx)
    ↓
 ┌──────────────┬───────────────┐
 ↓              ↓               ↓
queries/       stores/         lib/utils
(TanStack)     (Zustand)       (순수 함수)
    ↓
api (클라이언트)
    ↓
backend REST API
```
- 의존은 위→아래 단방향만 허용한다. `api` 레이어는 `hooks`/`components`를 import하지 않는다.
- `components`는 `api`를 직접 호출하지 않는다. 반드시 `hooks`(TanStack Query 훅)를 경유한다.
- 컴포넌트는 Presentational/Container를 엄격히 나누지 않되, 재사용 UI 조각(Button, Input, Modal 등)만 순수 Presentational로 분리한다.

### 3.3 Zustand vs TanStack Query 판단 기준
| 기준 | Zustand (클라이언트 상태) | TanStack Query (서버 상태) |
|---|---|---|
| 데이터 원천 | 서버 DB에 없는 클라이언트 전용 값 | 서버(REST API)에서 가져오는 값 |
| 예시 | 로그인 사용자 정보, 인증 여부, 필터 선택값(categoryId/status), 모달 열림 여부 | 할일 목록, 할일 상세, 카테고리 목록 |
| 캐싱/재검증 | 불필요 | 필요 (staleTime, invalidate, refetch) |

- 원칙: **"무엇을 볼지"(필터 선택값)는 Zustand, "그 선택값으로 조회한 결과"는 TanStack Query**로 관리한다. `todoFilterStore`의 값을 `useTodosQuery`의 쿼리 key로 전달한다.
- 폼 입력값(등록/수정 폼)은 전역 상태로 두지 않고 컴포넌트 로컬 상태로 관리한다.

## 4. 코드/네이밍 원칙

### 4.1 백엔드
| 대상 | 규칙 | 예시 |
|---|---|---|
| 파일명 | kebab-case | `todo.controller.js`, `todo.repository.js` |
| Controller 함수 | camelCase 동사+명사 | `createTodo`, `listTodos`, `updateTodo` |
| Service 함수 | 의도가 드러나는 이름 | `createTodoForUser`, `reassignTodosToDefaultCategory` |
| Repository 함수 | DB 동작 의미 반영 | `insertTodo`, `findTodoByIdAndUserId`, `deleteTodoById` |
| 라우트 경로 | REST 규약, 복수형, 버전 프리픽스 | `/api/v1/todos`, `/api/v1/todos/:todoId?categoryId=&status=` |
| SQL 관리 | `*.repository.js`에만 격리, 함수당 SQL 1개, 파라미터 바인딩(`$1,$2`) 필수, 문자열 concat 금지 | — |
| 컬럼/객체 매핑 | DB는 snake_case, JS 객체는 camelCase — 공용 mapper로 변환 | `case-mapper.js` |

### 4.2 프론트엔드
| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일/함수 | PascalCase | `TodoListPage.tsx` |
| 커스텀 훅 | camelCase, `use` 접두사 | `useTodoFilter.ts` |
| TanStack Query 훅 | `use{Entity}Query` / `use{Action}Mutation` | `useTodosQuery`, `useCreateTodoMutation` |
| Zustand 스토어 | `use{Name}Store.ts` | `useAuthStore.ts`, `useTodoFilterStore.ts` |
| API 함수 | camelCase 동사+명사 | `getTodos`, `createTodo` |
| 타입 | PascalCase, DTO는 명시적 접미사 | `Todo`, `CreateTodoRequest` |
| 상수 | UPPER_SNAKE_CASE | `TODO_STATUS` |
| 테스트 파일 | 대상 파일명 + `.test.ts(x)`, 동일 폴더 위치 | `deriveTodoStatus.test.ts` |

- 프론트엔드는 상대경로 지옥 방지를 위해 `@/` alias를 `tsconfig.json` + 빌드 설정에 등록한다.
- 백엔드/프론트엔드 모두 파생 로직(상태 계산 등)은 컴포넌트/컨트롤러에서 분리해 순수 함수로 둔다.

## 5. 테스트/품질 원칙

2일 일정 제약상 전체 커버리지 테스트는 지양하고(PRD 4.3 Out-of-Scope), **도메인 규칙과 직결된 순수 로직 위주로 최소·고가치 테스트**만 작성한다. 공통 우선순위 원칙:

1. **최우선**: 할일 상태 파생 계산 (`deriveTodoStatus`) — 시작전/진행중/완료/기한초과 경계값(시작일=오늘, 종료일=오늘, 완료 처리 시 기한 무관하게 '완료') 테스트. 백엔드·프론트 양쪽에서 각자 구현을 독립적으로 검증한다.
2. **차순위**: 날짜/폼 유효성 검증 로직(종료일자 ≥ 시작일자), 소유자 검증 로직(타 리소스 접근 시 404/차단 여부).
3. **선택**: 카테고리 삭제 시 할일 이관 트랜잭션(백엔드), 핵심 화면 스모크 테스트(프론트 — 로그인/등록 폼 제출 시 mutation 호출 여부만 확인).
4. **제외**: E2E, 부하 테스트, 100% 커버리지, 프레임워크 자체 동작 테스트, 상태관리 스토어의 단순 setter 테스트.

공통 원칙:
- 테스트 대상은 입출력이 명확한 **순수 함수**로 한정해 작성/유지 비용을 최소화한다.
- 백엔드는 `node:test` 또는 이미 익숙한 경량 러너, 프론트는 Vitest + React Testing Library처럼 신규 설정 비용이 적은 도구를 선택한다.
- 커밋 전 최소 체크(로컬): 백엔드는 unit test 통과, 프론트는 `tsc --noEmit` + `eslint` + `vitest run` 통과. 별도 CI 파이프라인 구축은 2일 일정상 생략 가능.

## 6. 설정/보안/운영 원칙

### 6.1 공통
- 환경변수는 `.env`(gitignore) + `.env.example`(커밋) 조합으로 관리하고, 앱 시작 시 필수 값 존재를 검증해 누락 시 즉시 실패(fail fast)한다.
- 비밀번호는 bcrypt 해시로만 저장(평문 저장 금지), JWT 시크릿은 환경변수로만 관리하고 코드에 하드코딩하지 않는다.
- 토큰 만료시간은 짧게(1~2시간) 설정해 stateless 인증 + 서버측 무효화 미구현이라는 설계상 리스크를 완화한다(PRD FR-2, 9.3 가정 참조).

### 6.2 백엔드
- **DB 커넥션 풀**: `pg.Pool` 단일 인스턴스를 전역 공유(요청마다 신규 커넥션 생성 금지). `max`, `idleTimeoutMillis`, `connectionTimeoutMillis` 명시적 설정. 1000명 동시접속 대응은 MVP 범위 밖이나, 향후 PgBouncer 등 외부 풀러 도입 여지를 구조적으로 남긴다.
- **에러 핸들링**: 공통 에러 미들웨어 1개로 통일. Controller/Service는 커스텀 `AppError(statusCode, message)`를 throw만 하고, 응답 변환은 미들웨어가 전담. 모든 라우트는 `asyncHandler`로 감싸 unhandled rejection을 방지한다.
- **로깅**: 요청 단위 로깅(method/path/status/응답시간). 에러 stack trace는 서버 로그에만 남기고 클라이언트 응답에는 노출하지 않는다. JWT/비밀번호는 로그에서 마스킹한다.
- **마이그레이션**: ORM 미사용이므로 `migrations/`에 순번 프리픽스 `.sql` 파일(`001_create_users.sql` 등)로 관리하고, 경량 마이그레이션 러너(예: `node-pg-migrate`)를 사용한다. 롤백(`down`) 스크립트도 함께 작성한다.
- **CORS/보안 미들웨어**: 프론트 오리진만 명시적 허용, `helmet` 적용, 입력 검증 라이브러리로 Controller 진입 전 payload를 검증하고 요청 크기를 제한한다.

### 6.3 프론트엔드
- **API 베이스 URL**: `VITE_API_BASE_URL` 환경변수로 관리하며, axios 등 API 클라이언트 인스턴스 1개로 통일해 컴포넌트/훅에서 URL을 하드코딩하지 않는다.
- **토큰 저장**: JWT는 localStorage에 저장(짧은 만료시간과 SPA 특성을 고려한 실용적 선택이며, httpOnly 쿠키 전환은 향후 과제로 분리). `localStorage` 직접 접근은 `authStore` 내부로 캡슐화하고 컴포넌트에서 직접 호출하지 않는다.
- **인터셉터**: 요청 인터셉터에서 토큰을 자동 부착(`Authorization: Bearer <token>`), 응답 인터셉터에서 401 발생 시 로그아웃 처리 + 로그인 페이지 리다이렉트를 공통화한다.
- **에러/로딩 공통화**: `isPending`/`isError` 상태에 대해 공통 컴포넌트(`LoadingSpinner`, `ErrorMessage`, `EmptyState`)를 재사용하고, `QueryClient` 전역 옵션과 mutation `onError`로 에러 메시지 처리를 일원화한다. 401(미인증)과 404(소유자 아님)는 서로 다르게 안내한다.
- **ErrorBoundary**: 앱 최상단에 1개만 두어 예기치 못한 렌더링 오류의 최소 방어선을 확보한다.

## 7. 백엔드 디렉토리 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js              # 환경변수 로드 및 필수값 검증
│   │   └── db.pool.js          # pg.Pool 인스턴스 생성/설정
│   │
│   ├── routes/
│   │   ├── index.js            # 라우트 통합 (v1 프리픽스 마운트)
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   └── todo.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   └── todo.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── category.service.js     # 삭제 시 할일 이관 트랜잭션 오케스트레이션
│   │   └── todo.service.js
│   │
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── category.repository.js
│   │   └── todo.repository.js      # 모든 raw SQL 캡슐화
│   │
│   ├── domain/
│   │   └── todo-status.js          # 상태 파생 계산 순수 함수
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT 검증, req.user 주입
│   │   ├── error-handler.js
│   │   ├── async-handler.js
│   │   └── validate.js
│   │
│   ├── utils/
│   │   ├── app-error.js
│   │   ├── case-mapper.js          # snake_case ↔ camelCase 변환
│   │   ├── with-transaction.js     # 트랜잭션 헬퍼
│   │   └── logger.js
│   │
│   ├── validators/
│   │   ├── auth.schema.js
│   │   ├── category.schema.js
│   │   └── todo.schema.js
│   │
│   ├── app.js                      # Express 앱 조립
│   └── server.js                   # 서버 실행 진입점
│
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_categories.sql
│   ├── 003_create_todos.sql
│   └── 004_seed_default_category.sql
│
├── tests/
│   ├── unit/
│   │   ├── todo-status.test.js
│   │   ├── date-validation.test.js
│   │   └── ownership.test.js
│   └── integration/
│       └── happy-path.test.js
│
├── .env.example
├── .env                         # (gitignore)
├── .gitignore
├── package.json
└── README.md
```

## 8. 프론트엔드 디렉토리 구조

```
frontend/
├── src/
│   ├── main.tsx                        # 엔트리포인트, QueryClientProvider/Router 셋업
│   ├── App.tsx                         # 라우팅 정의
│   │
│   ├── routes/                         # 페이지(라우트) 컴포넌트 — 기능 조합만 담당
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── todos/
│   │   │   ├── TodoListPage.tsx        # UC-5: 목록+필터
│   │   │   ├── TodoCreatePage.tsx      # UC-4
│   │   │   └── TodoEditPage.tsx        # UC-6
│   │   ├── categories/
│   │   │   └── CategoryManagePage.tsx  # UC-8, UC-9
│   │   └── account/
│   │       └── AccountSettingsPage.tsx # UC-3
│   │
│   ├── features/                       # 기능(도메인) 단위 로직 — 1차 분리 기준
│   │   ├── auth/
│   │   │   ├── api/authApi.ts
│   │   │   ├── hooks/{useLoginMutation,useSignupMutation}.ts
│   │   │   ├── store/useAuthStore.ts   # Zustand: accessToken, user, isAuthenticated
│   │   │   ├── components/{LoginForm,SignupForm}.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── api/categoryApi.ts
│   │   │   ├── hooks/{useCategoriesQuery,useCreateCategoryMutation,useUpdateCategoryMutation,useDeleteCategoryMutation}.ts
│   │   │   ├── components/{CategoryList,CategoryForm}.tsx
│   │   │   └── types.ts
│   │   │
│   │   └── todos/
│   │       ├── api/todoApi.ts          # getTodos(params), createTodo, updateTodo, deleteTodo
│   │       ├── hooks/{useTodosQuery,useTodoQuery,useCreateTodoMutation,useUpdateTodoMutation,useDeleteTodoMutation}.ts
│   │       ├── store/useTodoFilterStore.ts   # Zustand: 선택된 categoryId, status
│   │       ├── components/
│   │       │   ├── TodoList.tsx
│   │       │   ├── TodoListItem.tsx
│   │       │   ├── TodoFilterBar.tsx       # 카테고리+상태 AND 필터 UI
│   │       │   ├── TodoForm.tsx            # 등록/수정 공용 폼
│   │       │   ├── DateRangePicker.tsx     # 캘린더 날짜 선택 UI
│   │       │   └── TodoStatusBadge.tsx     # 파생 상태 뱃지 표시
│   │       ├── lib/
│   │       │   ├── deriveTodoStatus.ts     # 순수 함수 (테스트 1순위)
│   │       │   ├── deriveTodoStatus.test.ts
│   │       │   ├── validateTodoForm.ts     # 순수 함수 (테스트 2순위)
│   │       │   ├── validateTodoForm.test.ts
│   │       │   └── buildTodoQueryParams.ts # 필터 → 쿼리파라미터 변환
│   │       └── types.ts
│   │
│   ├── shared/                         # 기능 간 공유 요소 (2곳 이상에서 쓰일 때만 승격)
│   │   ├── components/{Button,Input,Modal,ConfirmDialog,LoadingSpinner,ErrorMessage,EmptyState}.tsx
│   │   ├── hooks/useDebounce.ts
│   │   └── layout/{AppLayout,ProtectedRoute}.tsx
│   │
│   ├── api/
│   │   └── client.ts                   # axios 인스턴스, 요청/응답 인터셉터
│   │
│   ├── lib/
│   │   ├── date.ts
│   │   └── errorUtils.ts               # getErrorMessage(error)
│   │
│   ├── types/
│   │   └── api.ts                      # ApiError, PaginatedResponse<T> 등
│   │
│   ├── styles/
│   │   └── globals.css                 # 반응형 기본 브레이크포인트, CSS 변수
│   │
│   └── test/
│       └── setup.ts                    # Vitest + RTL 공통 셋업
│
├── .env.example
├── .env                                 # (gitignore)
├── .gitignore
├── package.json
└── tsconfig.json
```

## 9. 요약

- 2장의 8가지 공통 원칙(단방향 의존, 관심사 분리, 파생 로직 순수 함수화, 기능 우선 조직화, 점진적 공통화, 비밀정보 분리, 404 우선 에러, 우선순위 기반 품질 투자)이 프론트/백엔드 모든 세부 규칙의 근거가 된다.
- 백엔드는 `Router→Controller→Service→Repository`, 프론트엔드는 `components→hooks→(queries/stores/lib)→api`로 계층을 분리하며, 두 스택 모두 "표시/입출력"과 "로직"과 "데이터 접근"을 물리적으로 다른 파일에 둔다.
- 테스트는 상태 파생 계산·날짜 유효성·소유자 검증 등 도메인 규칙과 직결된 순수 로직에 집중 투자하고, 나머지는 수동 확인으로 대체한다.
