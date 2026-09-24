# RPA 운영 현황 대시보드 — Claude Code 지침

<!--
사람용 메모 (HTML 주석은 Claude에게 전달되지 않음)
- 매 세션 시작 시 자동으로 읽힘. 200줄 이내 유지
- 같은 지적을 두 번 하게 되면 여기에 규칙으로 한 줄 추가
- 지원 정보·일정·진행 상태는 CLAUDE.local.md(커밋 제외)에 둠
- 권장: Output style을 Learning으로 (VS Code 입력창에 / → Output styles)
-->

## 프로젝트
- 무엇: RPA 운영 담당자가 프로세스 상태와 오류를 한눈에 보고 수기 재실행을 요청하는 사내 도구. 데이터는 전부 가상
- 왜: React + TypeScript를 직접 작성하며 익히는 학습·포트폴리오 프로젝트. 결과물은 GitHub 저장소 + Vercel 배포 링크
- 개발자: C#·VBA·SQL 기반 RPA/업무자동화 엔지니어(3년차). JavaScript·React·TypeScript는 이 프로젝트로 처음 배운다
- 환경: Windows, VS Code, PowerShell, Node LTS(24.x), npm

## 1순위 규칙: 학습 모드
목표는 완성된 코드가 아니라 개발자가 직접 쓰고 설명할 수 있는 코드다.
- 한 번에 전체 코드를 쓰지 않는다. 작은 단계로 나누고 각 단계를 `목표 → 코드 → 핵심 개념 → 직접 해볼 과제 → 확인 방법` 순서로 제시한다
- Claude가 작성해도 되는 것: 설정 파일, 뼈대, 반복 코드, 새 패턴의 첫 예시 1개
- 개발자가 작성할 것: 같은 패턴의 두 번째부터, 그리고 상태·이벤트 처리·fetch·타입 정의 같은 핵심 로직. 코드에 `// TODO(human): 할 일` 주석으로 자리를 만들고, 채팅에 과제 목표와 확인 방법을 적는다
- 개발자가 "직접 써 줘"라고 명시하면 작성하고, 그 사실을 AX 로그에 남긴다
- 막혔다고 하면 힌트를 단계적으로 준다: ① 방향 → ② 쓸 API·키워드 → ③ 일부 코드. 전체 정답은 요청할 때만
- 새 개념은 C#·VBA에 빗대어 1~3문장으로 설명한다. 기준 비유:
  - interface/type ≈ C# DTO(record), 유니온 리터럴 타입 ≈ enum, Promise·async/await ≈ Task·async/await
  - 컴포넌트 ≈ 공통 모듈, props ≈ 메서드 매개변수, 커스텀 훅 ≈ Helper Class
  - map/filter ≈ LINQ Select/Where, npm install ≈ NuGet 복원
- 답변은 한국어로, 설명은 짧게, 실행 위주로
- 라이브러리 사용법이 불확실하면 추측하지 말고 설치된 버전(package.json, node_modules의 타입 정의)을 확인한 뒤 답한다

## 세션 진행
- 시작: CLAUDE.local.md가 있으면 "현재 상태"를 확인하고, 이번 세션 목표를 한 줄로 확인받은 뒤 시작한다
- 기능 하나가 끝나면: 그 코드로 면접에서 나올 만한 질문 2~3개와 답변 포인트를 제시한다
- 개발자가 "세션 종료"라고 하면:
  1. `docs/ax-log.md`에 AX 로그를 추가한다 (형식은 맨 아래)
  2. CLAUDE.local.md의 "현재 상태"를 갱신한다
  3. 다음 세션에서 할 일을 한 줄로 제안한다
- `npm run dev`는 개발자가 별도 터미널에서 띄운다. Claude는 dev 서버를 실행하지 않고 `npm run build`·`npm run lint`로 확인한다

## 코드 리뷰
개발자가 "리뷰해줘"라고 하면 `git diff main...HEAD`와 커밋 전 변경(`git diff`)을 읽고 시니어 개발자처럼 리뷰한다.
1. 동작 여부: `npm run build`·`npm run lint` 결과를 근거로
2. 개선점: 중요도 순(버그·타입 안정성 > 구조·컴포넌트 분리 > 가독성), 항목마다 이유
3. PR 댓글에 붙여 넣을 3~5줄 요약

수정은 개발자가 하고, 수정 커밋으로 남긴다.

## 진행 순서 (세션 · 브랜치)
- S0 환경 세팅: Vite 생성, GitHub 연결, Vercel 첫 배포
- S1 API 명세 + 타입 정의 — `docs/api-spec`
- S2 MSW + 가상 데이터 — `feat/mock-api`
- S3 요약 카드 — `feat/summary-cards`
- S4 프로세스 목록 + 상태 뱃지 — `feat/process-list`
- S5 README v0.1 (로드맵 체크리스트 포함) — `docs/readme`
- S6 필터·검색 — `feat/filter-search`
- S7 상세 페이지 — `feat/process-detail`
- S8 수기 재실행 — `feat/manual-rerun`
- S9 공통화 리팩터링 (fetch 래퍼, 커스텀 훅) — `refactor/api-client`
- S10 README 완성 (구조도·핵심 타입·API 명세·AX 요약), v1.0.0 태그 — `docs/final`

## MVP 범위
| 기능 | 할 것 | 하지 않을 것 |
|---|---|---|
| 요약 카드 | 오늘 실행 건수·성공률·오류 건수 3개 고정 | 기간 선택 |
| 프로세스 목록 | 이름·담당 부서·실행 방식(예약/수기)·최근 상태 뱃지·최근 실행 시각 | 정렬, 페이지네이션 |
| 필터·검색 | 받아온 목록을 화면에서 필터링 (상태·실행 방식·이름) | 서버 측 필터 |
| 상세 | 실행 이력과 오류를 한 표로, 최근 20건 | 별도 오류 로그 화면 |
| 수기 재실행 | 상세 화면에서 기준일자 입력 → 결과 표시 | 재실행 후 이력 자동 갱신 |

- 제외: 로그인·권한, 자동 새로고침
- 확장 기능(테스트, Slack 알림, 반응형, 차트)은 MVP 완성 전에 제안하거나 구현하지 않는다. 작업 범위가 커지면 MVP 우선순위부터 상기시킨다

## API 명세 우선
- `docs/api-spec.md`가 기준이다. 명세에 없는 필드나 엔드포인트가 필요하면 코드보다 명세를 먼저 고치자고 제안한다
- 엔드포인트 (요청/응답 타입은 S1에서 확정)
  - `GET /api/summary` — 오늘 실행 건수·성공률·오류 건수
  - `GET /api/processes` — 프로세스 목록 (최근 실행 상태 포함)
  - `GET /api/processes/{id}` — 프로세스 상세
  - `GET /api/processes/{id}/runs` — 실행 이력 (실패 건은 오류 유형·메시지·발생 시각 포함)
  - `POST /api/processes/{id}/runs` — 수기 재실행 요청 (body: 기준일자) → 202 접수 / 400 잘못된 기준일자 / 409 이미 실행 중

## 기술 결정 (바꾸려면 개발자와 합의 후 이 파일부터 수정)
- 데이터 요청은 fetch + useState/useEffect로 직접 구현한다. React Query·Redux·Zustand 등은 쓰지 않는다
- 목 API는 MSW. 앱 코드는 실서버를 부르듯 `fetch('/api/...')`를 쓰고 MSW가 네트워크 계층에서 응답한다. 배포 환경에서도 워커를 켠다
  - `worker.start()`가 끝난 뒤 앱을 렌더링한다
  - 목 데이터 날짜는 고정값 금지. 현재 시각 기준 상대값으로 만든다 (배포 며칠 뒤에도 '오늘' 데이터가 보이도록)
  - 목 데이터 상태는 새로고침하면 초기화된다. README에 "MSW 목 API 데모"라고 명시한다
- 배포는 Vercel. React Router를 넣을 때 딥링크 새로고침 404를 막는 `vercel.json` rewrites도 함께 추가한다
- 스타일은 최소화: classless CSS 1개(후보 Pico CSS) + 필요한 만큼의 CSS. MUI·Ant Design 같은 UI 라이브러리와 Tailwind는 쓰지 않는다 (컴포넌트를 직접 나누는 과정을 보여주기 위해)
- 새 패키지는 설치 전에 이유를 설명하고 개발자 승인을 받는다
- 비밀값(예: Slack 웹훅 URL)은 프론트엔드 코드나 `VITE_` 환경변수에 넣지 않는다. 브라우저 번들에 그대로 노출된다

## 코드 규칙
- `any` 금지. 상태값은 유니온 리터럴 타입. 타입 단언(`as`)은 이유를 설명할 수 있을 때만
- API 타입은 `src/types/`에 명세와 1:1로 정의하고, 컴포넌트 props도 타입을 명시한다
- 이름: 컴포넌트 PascalCase(`StatusBadge.tsx`), 훅 `useXxx`, API 함수는 동사로 시작(`getProcesses`, `requestRerun`)
- 폴더: `src/api`(fetch 함수) · `src/mocks`(MSW 핸들러·가상 데이터) · `src/types` · `src/components`(재사용) · `src/pages`(화면)
- API를 호출하는 화면은 로딩·오류·빈 결과 상태를 모두 표시한다

## 데이터 규칙
- 모든 데이터는 가상이다. 실제 고객사명·프로세스 ID·업무 데이터는 쓰지 않는다
- 프로세스명은 의류 회사 사내 업무를 가정한 일반 명칭 (예: 매장 일일 매출 집계, 재고 동기화, 신규 입사자 계정 생성), ID는 `PRC-001` 형식

## Git 규칙
- 브랜치: `feat/*`, `fix/*`, `refactor/*`, `docs/*`, `chore/*`. main 직접 커밋 금지 (최초 초기화 커밋만 예외)
- PR로만 병합하고 병합 방식은 merge commit. squash 금지 (리뷰 반영 커밋이 이력에 남아야 함)
- 커밋 메시지: `타입: 한국어 요약` (예: `feat: 프로세스 목록 화면 추가`). 단계가 끝날 때마다 제안한다
- commit·push·PR 병합은 개발자가 직접 실행한다. Claude는 명령과 메시지만 제안한다 (개발자가 요청하면 예외)
- 커밋 전 `npm run build`·`npm run lint` 통과, PR 전 `TODO(human)` 잔존 여부 확인
- 개발자에게 안내하는 터미널 명령은 Windows PowerShell 기준으로 한 줄씩 (`&&`로 잇지 않는다)

## 명령어
- `npm run dev` — 개발 서버 (http://localhost:5173)
- `npm run build` — 타입 검사 + 프로덕션 빌드 (Vercel도 이 명령으로 빌드)
- `npm run lint` — ESLint
- `npm run preview` — 빌드 결과를 로컬에서 확인

## AX 로그 형식 (`docs/ax-log.md`에 누적)
```markdown
## YYYY-MM-DD / 작업 내용
- AI가 제안한 것:
- 내가 판단하거나 수정한 것과 그 이유:
- 새로 배운 개념:
```
"내가 판단하거나 수정한 것"은 개발자에게 물어서 채운다. 추측으로 채우지 않는다.
