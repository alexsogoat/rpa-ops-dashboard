// docs/api-spec.md 2~5번 (/api/processes 하위 엔드포인트)와 1:1 대응
import type {
  DateString,
  DateTimeString,
  ErrorType,
  RunStatus,
  TriggerType,
} from './common';

/** GET /api/processes 응답 배열의 항목 */
export interface Process {
  /** 프로세스 ID, `PRC-001` 형식 */
  id: string;
  /** 프로세스 이름 */
  name: string;
  /** 담당 부서 이름 (표시용) */
  department: string;
  /** 기본 실행 방식 */
  triggerType: TriggerType;
  /** 가장 최근 실행 1건의 상태. 실행 이력이 없으면 null */
  lastStatus: RunStatus | null;
  /** 가장 최근 실행의 시작 시각. 실행 이력이 없으면 null */
  lastRunAt: DateTimeString | null;
}

/** GET /api/processes/{id} 응답 */
export interface ProcessDetail extends Process {
  /** 업무 설명 */
  description: string;
  /** 예약 주기 (표시용 문장). 수기 실행 프로세스면 null */
  schedule: string | null;
}

/** 실행 오류 정보 */
export interface RunError {
  type: ErrorType;
  message: string;
  /** 오류 발생 시각 */
  occurredAt: DateTimeString;
}

/** GET /api/processes/{id}/runs 응답 배열의 항목 */
export interface Run {
  /** 실행 ID, `RUN-000001` 형식 */
  id: string;
  status: RunStatus;
  /** 이번 실행이 시작된 방식 */
  triggerType: TriggerType;
  /** 기준일자 (처리 대상 업무일) */
  baseDate: DateString;
  startedAt: DateTimeString;
  /** 종료 시각. 실행 중이면 null */
  endedAt: DateTimeString | null;
  /** 오류 정보. status가 'failed'일 때만 값이 있음 */
  error: RunError | null;
}

/** POST /api/processes/{id}/runs 요청 본문 */
export interface RerunRequest {
  /** 기준일자. 오늘(KST) 또는 과거 날짜 */
  baseDate: DateString;
}

/** POST /api/processes/{id}/runs 202 응답 */
export interface RerunResponse {
  /** 새로 생성된 실행 ID */
  runId: string;
  /** 접수된 기준일자 */
  baseDate: DateString;
  /** 접수 시각 */
  acceptedAt: DateTimeString;
}
