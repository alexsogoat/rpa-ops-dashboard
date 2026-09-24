// docs/api-spec.md "공통 규칙" · "공통 값 목록"과 1:1 대응

/** 날짜 `YYYY-MM-DD` (예: "2026-09-24") */
export type DateString = string;

/** 일시 ISO 8601 + KST 오프셋 (예: "2026-09-24T09:30:00+09:00") */
export type DateTimeString = string;

/** 실행 상태 */
export type RunStatus = 'success' | 'failed' | 'running';

/** 실행 방식 */
export type TriggerType = 'scheduled' | 'manual';

/** 오류 유형 */
export type ErrorType =
  | 'timeout'
  | 'element_not_found'
  | 'login_failed'
  | 'data_error'
  | 'system_error';

/** 4xx·5xx 공통 오류 응답 */
export interface ApiError {
  code: string;
  message: string;
}
