# RPA 운영 대시보드

RPA 운영 담당자가 자동화 프로세스의 상태와 오류를 한눈에 확인하고, 필요할 때 기준일자를 지정해 수기 재실행을 요청하는 사내 도구입니다.

- **배포**: https://rpa-ops-dashboard.vercel.app
- **버전**: v0.1 (오늘 요약 · 프로세스 목록)

> **MSW 목 API 데모입니다.** 실제 서버 없이 브라우저에서 [MSW](https://mswjs.io/)가 API 응답을 대신합니다. 모든 데이터는 가상이며, 새로고침하면 초기화됩니다.

## 주요 기능 (v0.1)

| 기능 | 내용 |
|---|---|
| 오늘 요약 | 오늘 실행 건수 · 성공률 · 오류 건수 카드. 성공률은 완료된 실행 기준이며, 완료 건이 없으면 `-` |
| 프로세스 목록 | 이름 · 담당 부서 · 실행 방식(예약/수기) · 최근 상태 뱃지 · 최근 실행 시각 |
| 화면 상태 처리 | API를 호출하는 영역마다 로딩 · 오류 · 빈 결과를 표시. 요약과 목록은 서로 독립적으로 동작 |

## 로드맵

- [x] 환경 세팅 (Vite, GitHub, Vercel)
- [x] API 명세 + 타입 정의
- [x] MSW 목 API + 가상 데이터
- [x] 오늘 요약 카드
- [x] 프로세스 목록 + 상태 뱃지
- [x] README v0.1
- [x] 필터 · 검색 (상태 · 실행 방식 · 이름)
- [x] 프로세스 상세 (실행 이력과 오류, 최근 20건)
- [ ] 수기 재실행 (기준일자 입력 → 202 접수 / 400 잘못된 기준일자 / 409 이미 실행 중)
- [ ] 공통화 리팩터링 (fetch 래퍼, 커스텀 훅)
- [ ] README 완성, v1.0.0

## 기술 스택

React 19 · TypeScript 6 · Vite 8 · MSW 2 · Vercel

- 데이터 요청은 `fetch` + `useState`/`useEffect`로 직접 구현했습니다. 데이터 패칭·상태 관리 라이브러리는 쓰지 않습니다.
- UI 라이브러리 없이 컴포넌트와 CSS를 직접 작성했습니다.

## 구조

```
docs/api-spec.md        API 명세 (기준 문서)
src/
  types/                명세와 1:1로 맞춘 타입
  api/                  fetch 함수 (getSummary, getProcesses, getProcessDetail, getProcessRuns)
  pages/                화면 (DashboardPage, ProcessDetailPage, NotFoundPage)
  components/           재사용 컴포넌트 (요약 카드, 목록·이력 표, 필터 바, 상태 뱃지 등)
  utils/                표시용 포맷 함수
  mocks/                MSW 핸들러 · 가상 데이터
public/
  mockServiceWorker.js  MSW Service Worker
```

화면(`pages`)이 fetch 함수(`api`)를 부르면, `fetch('/api/…')` 요청을 MSW(`mocks`)가 가로채 명세대로 응답합니다. 앱 코드는 실서버를 부를 때와 같으므로, 실서버가 생기면 `src/mocks`와 워커 시작 코드만 걷어 내면 됩니다.

## API

명세 전문: [docs/api-spec.md](docs/api-spec.md)

| 메서드 | 경로 | 설명 | 상태 |
|---|---|---|---|
| GET | `/api/summary` | 오늘 요약 | 구현 |
| GET | `/api/processes` | 프로세스 목록 | 구현 |
| GET | `/api/processes/{id}` | 프로세스 상세 | 구현 |
| GET | `/api/processes/{id}/runs` | 실행 이력 (최근 20건) | 구현 |
| POST | `/api/processes/{id}/runs` | 수기 재실행 요청 (202 · 400 · 409) | 예정 |

## 로컬 실행

Node 24 LTS 기준입니다.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입 검사 + 프로덕션 빌드
npm run lint
```

## 개발 방식

- AI 도구(Claude Code)와 협업하며 개발합니다. 협업 규칙은 [CLAUDE.md](CLAUDE.md)에, 세션별 기록은 [docs/ax-log.md](docs/ax-log.md)에 남깁니다.
- 기능마다 브랜치를 만들고 PR로 병합합니다. 리뷰 반영 이력이 남도록 merge commit을 사용합니다.
