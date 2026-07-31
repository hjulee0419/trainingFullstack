# TodoList Frontend

React 19 + TypeScript + Zustand + TanStack Query 기반 SPA. 전체 프로젝트 개요는 [루트 README](../README.md), 디렉토리 구조는 [`docs/4-project-structure.md`](../docs/4-project-structure.md) 8장, 디자인 토큰/스타일 규칙은 [`docs/9-style-guide.md`](../docs/9-style-guide.md)를 참조하세요.

## 환경변수

```bash
cp .env.example .env
```
`VITE_API_BASE_URL`을 백엔드 주소로 지정합니다(로컬 `http://localhost:3000/api/v1` 또는 배포 `https://lhj-be.vercel.app/api/v1`). Vite는 이 값을 빌드 타임에 번들에 고정하므로, 값을 바꾼 뒤에는 dev 서버 재시작(또는 프로덕션이면 재빌드/재배포)이 필요합니다.

## 실행

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build → dist/
npm run preview   # 빌드 결과 로컬 미리보기
```

로그인 성공 시 대시보드(달력) 화면으로 랜딩합니다. GNB에서 언어(한/영)·다크모드 토글을 사용할 수 있습니다.

## 테스트

```bash
npm test              # Vitest
npm run test:coverage # 커버리지 포함
npm run lint           # ESLint
```

## 배포

Vercel 배포 시 `vercel.json`의 SPA fallback(모든 경로 → `index.html`)이 적용되어 있어야 딥링크/새로고침이 정상 동작합니다(React Router `BrowserRouter` 사용). Vercel 프로젝트 설정에서 `VITE_API_BASE_URL` 환경변수를 지정하고, 백엔드의 `CORS_ORIGIN`에 이 프론트엔드 배포 도메인이 등록되어 있는지 확인하세요.
