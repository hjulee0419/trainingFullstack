# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 제공하는 가이드다.

## 프로젝트 개요

TodoList: 시작일/종료일을 가지며 상태(시작전/진행중/완료/기한초과)가 자동으로 파생되는, 인증 기반 개인용 할일 관리 웹 앱. 1인 개발·2일 MVP로 구축된다. 기술 스택은 확정되어 있으며 대안 검토 대상이 아니다: **React 19 + TypeScript + Zustand + TanStack Query**(프론트엔드, 아직 스캐폴딩 안 됨), **Node.js + Express + `pg`**(ORM 미사용, 백엔드, 진행 중), **PostgreSQL 17**.

전체 요구사항/설계는 `docs/`에 있다(아래 링크 참조) — 코드만 보고 동작을 추측하지 말고, 작업 전에 관련 문서를 먼저 읽어라.

## 프로젝트에 반드시 적용할 지침

- 모든 대화는 한국어로 진행할 것
- 지시하지 않은 작업 수행하지 말것(오버엔지니어링 금지)

## 서버 실행 (`backend/`)

```bash
npm run dev     # 개발 서버 (node --watch, 파일 저장 시 자동 재시작)
npm start       # 프로덕션과 동일한 방식으로 1회 기동 (node src/server.js)
```
`backend/.env`(gitignore 대상)에 `DATABASE_URL` 등 필수 환경변수가 없으면 fail-fast로 즉시 종료된다. 기동 확인은 `GET /api/v1/health`(DB 커넥션 확인 포함).

## 참조 문서 (`docs/`)

작업 전에 해당 태스크가 다루는 문서를 먼저 읽어라 — FR 번호나 제약조건을 추측하지 말 것:

- [`1-domain-definition.md`](docs/1-domain-definition.md) — 핵심 엔티티, 비즈니스 규칙(다른 문서에서 "규칙 N"으로 참조되는 번호 매겨진 도메인 규칙), "403이 아닌 404" 소유자 규칙.
- [`2-PRD.md`](docs/2-PRD.md) — Must/Should/Could 우선순위가 매겨진 기능 요구사항 FR-1~FR-13, 비기능 요구사항(6.1 성능 목표: 평균 300ms/p95 800ms), 기술 스택 선정 근거, 2일 일정표.
- [`3-user-scenario.md`](docs/3-user-scenario.md) — P1/P2/P3 정상 흐름 시나리오와 E-1~E-8 경계/에러 케이스(태스크 완료조건에서 "E-1" = 종료일자<시작일자 식으로 참조됨).
- [`4-project-structure.md`](docs/4-project-structure.md) — 8가지 공통 원칙, 백엔드/프론트엔드 레이어링, 네이밍 규칙, `backend/`·`frontend/` 전체 목표 디렉토리 트리.
- [`5-arch-diagram.md`](docs/5-arch-diagram.md) — 시스템 아키텍처 다이어그램.
- [`6-erd.md`](docs/6-erd.md) — `users`/`categories`/`todos`의 테이블·컬럼 정의와 제약조건.
- [`7-execution-plan.md`](docs/7-execution-plan.md) — 위에서 설명한 태스크 분할 문서. 태스크별 "완료"의 기준이 되는 원본.
- [`8-wireframe.md`](docs/8-wireframe.md) — 프론트엔드 화면 와이어프레임.
- [`swagger/swagger.json`](swagger/swagger.json) — API 계약(contract).
