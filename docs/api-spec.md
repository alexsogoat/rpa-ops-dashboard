# RPA 운영 대시보드 API 명세 (v0.1)

> 이 문서가 기준이다. 필드·엔드포인트를 바꿀 때는 코드보다 이 문서를 먼저 고친다.
> 실제 서버는 없고 MSW가 이 명세대로 응답한다.

## 엔드포인트 목록

| 메서드 | 경로 | 설명 | 성공 | 오류 |
|---|---|---|---|---|
| GET | `/api/summary` | 오늘 요약 | 200 | |
| GET | `/api/processes` | 프로세스 목록 | 200 | |
| GET | `/api/processes/{id}` | 프로세스 상세 | 200 | 404 |
| GET | `/api/processes/{id}/runs` | 실행 이력 (최근 20건) | 200 | 404 |
| POST | `/api/processes/{id}/runs` | 수기 재실행 요청 | 202 | 400, 404, 409 |

## 공통 규칙

| 항목 | 규칙 | 예 |
|---|---|---|
| Base URL | 같은 출처의 `/api` | `fetch('/api/summary')` |
| 형식 | 요청·응답 모두 JSON (`Content-Type: application/json`) | |
| 필드 이름 | camelCase | `lastRunAt` |
| 상태·구분 값 | 소문자 영문 문자열 (TS 유니온 리터럴 타입으로 정의) | `"scheduled"` |
| 일시 | ISO 8601, 초 단위, KST 오프셋(`+09:00`) 포함 | `"2026-09-24T09:30:00+09:00"` |
| 날짜 | `YYYY-MM-DD` | `"2026-09-24"` |
| 값 없음 | 필드를 생략하지 않고 `null` | `"lastRunAt": null` |
| "오늘" | KST 00:00 ~ 요청 시각 | |

### 공통 값 목록

여러 엔드포인트에서 같은 값 목록을 쓴다. 각 목록은 TS 유니온 타입 하나로 정의한다.

**실행 상태** (`RunStatus`)

| 값 | 의미 | 화면 표시 |
|---|---|---|
| `"success"` | 정상 종료 | 성공 |
| `"failed"` | 오류로 종료 | 실패 |
| `"running"` | 실행 중 (종료 전) | 실행 중 |

**실행 방식** (`TriggerType`)

| 값 | 의미 | 화면 표시 |
|---|---|---|
| `"scheduled"` | 스케줄러에 의한 예약 실행 | 예약 |
| `"manual"` | 담당자의 수기 실행 | 수기 |

**오류 유형** (`ErrorType`)

| 값 | 의미 | 화면 표시 |
|---|---|---|
| `"timeout"` | 제한 시간 초과 | 시간 초과 |
| `"element_not_found"` | 화면 요소를 찾지 못함 (UI 변경 등) | 화면 요소 없음 |
| `"login_failed"` | 대상 시스템 로그인 실패 | 로그인 실패 |
| `"data_error"` | 입력·원천 데이터 오류 | 데이터 오류 |
| `"system_error"` | 그 밖의 시스템 오류 | 시스템 오류 |

### 오류 응답 (4xx·5xx 공통)

```json
{
  "code": "PROCESS_NOT_FOUND",
  "message": "프로세스를 찾을 수 없습니다: PRC-999"
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `code` | string | 기계가 분기할 때 쓰는 오류 코드 (대문자 스네이크) |
| `message` | string | 화면에 그대로 보여줄 수 있는 한국어 메시지 |

| HTTP | `code` | 발생 조건 |
|---|---|---|
| 400 | `INVALID_BASE_DATE` | 기준일자가 없거나, 형식이 틀리거나, 존재하지 않는 날짜이거나, 미래 날짜 |
| 404 | `PROCESS_NOT_FOUND` | `{id}`에 해당하는 프로세스가 없음 |
| 409 | `PROCESS_ALREADY_RUNNING` | 해당 프로세스가 이미 실행 중 |

---

## 1. `GET /api/summary` — 오늘 요약

요약 카드 3개(오늘 실행 건수·성공률·오류 건수)에 쓴다.

### 요청
파라미터 없음.

### 응답 `200 OK`

```json
{
  "date": "2026-09-24",
  "totalRuns": 128,
  "successRate": 96.1,
  "errorCount": 5
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `date` | string (날짜) | 집계 기준일 (KST 오늘) |
| `totalRuns` | number | 오늘 시작된 실행 건수 (실행 중 포함) |
| `successRate` | number \| null | 완료된 실행(성공 + 실패) 중 성공 비율(%), 0~100, 소수점 1자리. 완료 건수가 0이면 `null` |
| `errorCount` | number | 오늘 실패한 실행 건수 |

- `successRate`의 분모에서 실행 중인 건은 뺀다. 아직 끝나지 않은 건을 실패로 세지 않기 위해서다.
- 화면에서는 `null`을 `-`로 표시한다.

---

## 2. `GET /api/processes` — 프로세스 목록

프로세스 목록 화면에 쓴다. 최근 실행 상태를 함께 내려준다. 정렬·페이지네이션·서버 측 필터는 없다.

### 요청
파라미터 없음.

### 응답 `200 OK`

프로세스 항목(`Process`)의 배열.

```json
[
  {
    "id": "PRC-001",
    "name": "매장 일일 매출 집계",
    "department": "영업관리팀",
    "triggerType": "scheduled",
    "lastStatus": "success",
    "lastRunAt": "2026-09-24T06:00:00+09:00"
  },
  {
    "id": "PRC-007",
    "name": "신규 입사자 계정 생성",
    "department": "인사팀",
    "triggerType": "manual",
    "lastStatus": null,
    "lastRunAt": null
  }
]
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 프로세스 ID, `PRC-001` 형식 |
| `name` | string | 프로세스 이름 |
| `department` | string | 담당 부서 이름 (표시용, 예: 인사팀) |
| `triggerType` | `TriggerType` | 기본 실행 방식 |
| `lastStatus` | `RunStatus` \| null | 가장 최근 실행 1건의 상태. 실행 이력이 없으면 `null` |
| `lastRunAt` | string (일시) \| null | 가장 최근 실행의 시작 시각. 실행 이력이 없으면 `null` |

- `lastStatus`와 `lastRunAt`은 항상 함께 `null`이거나 함께 값이 있다.
- 화면에서는 `lastStatus`가 `null`이면 "이력 없음", `lastRunAt`이 `null`이면 `-`로 표시한다.

---

## 3. `GET /api/processes/{id}` — 프로세스 상세

상세 화면 상단의 프로세스 정보에 쓴다.

### 요청

| 위치 | 이름 | 타입 | 설명 |
|---|---|---|---|
| 경로 | `id` | string | 프로세스 ID (예: `PRC-001`) |

### 응답 `200 OK`

목록 항목(`Process`)의 모든 필드에 아래 필드를 더한 객체(`ProcessDetail`).

```json
{
  "id": "PRC-001",
  "name": "매장 일일 매출 집계",
  "department": "영업관리팀",
  "triggerType": "scheduled",
  "lastStatus": "success",
  "lastRunAt": "2026-09-24T06:00:00+09:00",
  "description": "전 매장 POS 매출을 집계해 영업관리팀 공유 폴더에 일일 리포트로 저장한다.",
  "schedule": "매일 06:00"
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| (목록 항목 필드) | | `Process`와 같음 |
| `description` | string | 업무 설명 |
| `schedule` | string \| null | 예약 주기 (표시용 문장). `triggerType`이 `"manual"`이면 `null` |

### 오류
- `404 PROCESS_NOT_FOUND`

---

## 4. `GET /api/processes/{id}/runs` — 실행 이력

상세 화면의 실행 이력 표에 쓴다. 실행 이력과 오류를 한 표로 보여준다.

### 요청

| 위치 | 이름 | 타입 | 설명 |
|---|---|---|---|
| 경로 | `id` | string | 프로세스 ID |

쿼리 파라미터 없음. 서버가 **시작 시각 내림차순(최신순)으로 최근 20건**을 돌려준다.

### 응답 `200 OK`

실행 항목(`Run`)의 배열. 이력이 없으면 빈 배열 `[]`.

```json
[
  {
    "id": "RUN-000128",
    "status": "failed",
    "triggerType": "scheduled",
    "baseDate": "2026-09-24",
    "startedAt": "2026-09-24T06:00:00+09:00",
    "endedAt": "2026-09-24T06:03:12+09:00",
    "error": {
      "type": "element_not_found",
      "message": "POS 관리자 화면에서 '매출 조회' 버튼을 찾을 수 없습니다.",
      "occurredAt": "2026-09-24T06:03:10+09:00"
    }
  },
  {
    "id": "RUN-000121",
    "status": "success",
    "triggerType": "manual",
    "baseDate": "2026-09-22",
    "startedAt": "2026-09-23T14:20:00+09:00",
    "endedAt": "2026-09-23T14:24:41+09:00",
    "error": null
  }
]
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 실행 ID, `RUN-000001` 형식 |
| `status` | `RunStatus` | 실행 상태 |
| `triggerType` | `TriggerType` | 이번 실행이 시작된 방식 (예약 프로세스도 수기 재실행하면 `"manual"`) |
| `baseDate` | string (날짜) | 기준일자 (처리 대상 업무일) |
| `startedAt` | string (일시) | 시작 시각 |
| `endedAt` | string (일시) \| null | 종료 시각. `status`가 `"running"`이면 `null` |
| `error` | `RunError` \| null | 오류 정보. `status`가 `"failed"`일 때만 값이 있고, 나머지는 `null` |

**`RunError`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `type` | `ErrorType` | 오류 유형 |
| `message` | string | 오류 메시지 |
| `occurredAt` | string (일시) | 오류 발생 시각 |

### 오류
- `404 PROCESS_NOT_FOUND`

---

## 5. `POST /api/processes/{id}/runs` — 수기 재실행 요청

상세 화면에서 기준일자를 입력해 재실행을 요청한다. 요청을 **접수만** 하고 실행 완료를 기다리지 않는다 (그래서 `202 Accepted`).

### 요청

| 위치 | 이름 | 타입 | 설명 |
|---|---|---|---|
| 경로 | `id` | string | 프로세스 ID |
| 본문 | `baseDate` | string (날짜) | 기준일자. 오늘(KST) 또는 과거 날짜 |

```json
{
  "baseDate": "2026-09-23"
}
```

### 응답 `202 Accepted`

```json
{
  "runId": "RUN-000129",
  "baseDate": "2026-09-23",
  "acceptedAt": "2026-09-24T10:15:00+09:00"
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `runId` | string | 새로 생성된 실행 ID |
| `baseDate` | string (날짜) | 접수된 기준일자 |
| `acceptedAt` | string (일시) | 접수 시각 |

### 오류

| HTTP | `code` | 조건 | `message` 예 |
|---|---|---|---|
| 400 | `INVALID_BASE_DATE` | `baseDate` 누락, `YYYY-MM-DD` 형식 아님, 없는 날짜(예: `2026-02-30`), 미래 날짜 | 기준일자는 오늘 또는 과거 날짜(YYYY-MM-DD)여야 합니다. |
| 404 | `PROCESS_NOT_FOUND` | 프로세스 없음 | 프로세스를 찾을 수 없습니다: PRC-999 |
| 409 | `PROCESS_ALREADY_RUNNING` | 해당 프로세스의 `lastStatus`가 `"running"` | 이미 실행 중인 프로세스입니다. 완료 후 다시 요청하세요. |

- 검사 순서: 404 → 400 → 409. 없는 프로세스라면 기준일자를 검사할 필요가 없다.
- 재실행을 접수해도 목록·이력은 자동으로 갱신하지 않는다 (MVP 범위 밖).
