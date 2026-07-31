# TodoList

시작일/종료일을 가지며 상태(시작 전/진행중/완료/기한초과)가 자동으로 파생되는, 인증 기반 개인용 할일 관리 웹 앱입니다. 요구사항/설계 전체 문서는 [`docs/`](docs/)를 참조하세요 — 특히 처음 열어본다면 [`docs/1-domain-definition.md`](docs/1-domain-definition.md)(도메인/규칙)와 [`docs/4-project-structure.md`](docs/4-project-structure.md)(실제 디렉토리 구조)부터 보는 걸 권장합니다.

## 기술 스택
- **프론트엔드**: React 19 + TypeScript + Zustand + TanStack Query (`frontend/`)
- **백엔드**: Node.js + Express + `pg`(ORM 미사용) (`backend/`)
- **DB**: PostgreSQL 17 — 로컬 인스턴스 또는 Supabase 중 선택 가능(아래 참조)

## 배포 상태

| 구성요소 | URL | 비고 |
|---|---|---|
| 백엔드 | https://lhj-be.vercel.app/api/v1 | Vercel 배포, DB는 Supabase `todolist` 프로젝트(ap-northeast-2, project_id `qxkymonahreumvgnqeoj`)에 연결됨 |
| 프론트엔드 | https://lhj-fe.vercel.app | Vercel 배포, `frontend/vercel.json`에 SPA fallback rewrite 설정됨(딥링크/새로고침 정상 동작 확인됨) |
| Health check | https://lhj-be.vercel.app/api/v1/health | DB 연결 상태 포함 |
| Swagger UI | https://lhj-be.vercel.app/api/v1/docs (또는 로컬 실행 시 http://localhost:3000/api/v1/docs) | API 계약(`swagger/swagger.json`) 문서 |

> 백엔드의 `CORS_ORIGIN`(배포 환경변수)에 `https://lhj-fe.vercel.app`가 이미 등록되어 있습니다. 프론트엔드 배포 도메인이 바뀌면 함께 갱신해야 합니다.

## 다른 PC에서 이어서 작업/테스트하기

### 0. 사전 요구사항
- Node.js 20+ (LTS 권장)
- PostgreSQL 17 — 아래 "DB 연결" 중 하나 선택

### 1. 클론 및 의존성 설치
```bash
git clone https://github.com/hjulee0419/trainingFullstack.git
cd trainingFullstack
cd backend && npm install
cd ../frontend && npm install
```

### 2. 환경변수 설정
`backend/.env.example`을 복사해 `backend/.env`를 만들고 값을 채웁니다.
```bash
cp backend/.env.example backend/.env
```

**DB 연결은 둘 중 하나를 선택:**

- **A) 로컬 PostgreSQL** — `DATABASE_URL`을 로컬 인스턴스로 지정한 뒤 마이그레이션 실행:
  ```bash
  cd backend
  npm run migrate:up   # migrations/0001~0003 순서대로 적용 (자세한 규칙은 migrations/README.md)
  ```
- **B) Supabase(이미 스키마 마이그레이션 완료된 프로젝트 재사용)** — Supabase 대시보드(프로젝트 `todolist`)에서 Connection String을 복사해 `DATABASE_URL`에 붙여넣으면 됩니다. 이 경우 테이블이 이미 존재하므로 `migrate:up`을 실행할 필요가 없습니다. (단, `sslmode=require` 등 Supabase 커넥션 문자열의 파라미터를 그대로 유지하세요.)

`frontend/.env.example`을 복사해 `frontend/.env`를 만들고, 로컬 백엔드를 쓸지/배포된 백엔드를 쓸지에 따라 `VITE_API_BASE_URL`을 지정합니다.
```bash
cp frontend/.env.example frontend/.env
# 로컬 백엔드 사용 시: http://localhost:3000/api/v1 (기본값)
# 배포 백엔드 사용 시: https://lhj-be.vercel.app/api/v1
```

### 3. 개발 서버 실행
```bash
cd backend && npm run dev    # http://localhost:3000 (포트 점유 시 자동 정리 후 기동)
cd frontend && npm run dev   # http://localhost:5173
```
로그인 후 대시보드(달력)가 기본 화면으로 뜹니다. 최초 실행이라면 회원가입부터 진행하세요(가입 시 '기본' 카테고리가 자동 생성됩니다).

### 4. 테스트
```bash
cd backend && npm test              # 통합/단위 테스트(node:test), 커버리지 리포트 포함
cd frontend && npm test             # Vitest
cd frontend && npm run test:coverage
```

**시나리오 기반 통합 테스트(curl, `docs/3-user-scenario.md` 기준)**:
```bash
BASE_URL=http://localhost:3000/api/v1 bash test/e2e/curl-scenario-test.sh   # 로컬 대상
BASE_URL=https://lhj-be.vercel.app/api/v1 bash test/e2e/curl-scenario-test.sh  # 배포 서버 대상
```
실행할 때마다 타임스탬프가 붙은 신규 테스트 계정을 생성하므로 반복 실행해도 안전합니다. 이전 실행 결과는 `test/e2e/*.log`, `test/e2e/*.md`에 남아 있습니다(둘 다 `.gitignore` 대상이라 저장소에는 포함되지 않음 — 로컬에만 존재).

## 문서 맵 (`docs/`)
| 문서 | 내용 |
|---|---|
| [`1-domain-definition.md`](docs/1-domain-definition.md) | 핵심 엔티티, 번호 매겨진 비즈니스 규칙("규칙 N"으로 다른 문서에서 참조됨) |
| [`2-PRD.md`](docs/2-PRD.md) | 기능 요구사항 FR-1~FR-16(Must/Should/Could), 비기능 요구사항, 기술 스택 근거 |
| [`3-user-scenario.md`](docs/3-user-scenario.md) | 정상 흐름 시나리오(P1~P3, 대시보드), 경계 케이스 E-1~E-8 |
| [`4-project-structure.md`](docs/4-project-structure.md) | 백엔드/프론트엔드 실제 디렉토리 구조, 레이어링·네이밍 원칙 |
| [`5-arch-diagram.md`](docs/5-arch-diagram.md) | 시스템 아키텍처 다이어그램 |
| [`6-erd.md`](docs/6-erd.md) | 테이블·컬럼·제약조건 정의(`backend/migrations/`, `database/schema.sql`과 일치) |
| [`7-execution-plan.md`](docs/7-execution-plan.md) | 태스크 분할 및 완료조건 체크리스트(DB/BE/FE 전 항목 완료 상태) |
| [`8-wireframe.md`](docs/8-wireframe.md) | 화면별 와이어프레임(S1~S7), 화면 전환 흐름도 |
| [`9-style-guide.md`](docs/9-style-guide.md) | 디자인 토큰, 컴포넌트 스타일 규칙 |
| [`swagger/swagger.json`](swagger/swagger.json) | API 계약(Swagger UI로도 확인 가능) |

## 참고
- `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`: 이 저장소에서 작업할 때 지켜야 할 규칙(한국어 진행, 레이어링, 스타일 가이드 준수 등).
- `database/schema.sql`: `backend/migrations/0001~0003`을 한 파일로 합친 참조용 스키마(마이그레이션 파일이 실제 소스, 이 파일은 한눈에 보기용).
- Supabase 프로젝트(`todolist`)는 curl/E2E 테스트로 생성한 더미 계정을 주기적으로 정리했습니다(2026-07-31 기준 `users`/`categories`/`todos` 모두 0건). 새로 테스트할 때는 회원가입부터 시작하세요.
