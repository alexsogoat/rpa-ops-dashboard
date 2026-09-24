import type { DateString } from './common';

/** GET /api/summary 응답 */
export interface Summary {
  /** 집계 기준일 (KST 오늘) */
  date: DateString;
  /** 오늘 시작된 실행 건수 (실행 중 포함) */
  totalRuns: number;
  /** 완료된 실행 중 성공 비율(%), 0~100. 완료 건수가 0이면 null */
  successRate: number | null;
  /** 오늘 실패한 실행 건수 */
  errorCount: number;
}
