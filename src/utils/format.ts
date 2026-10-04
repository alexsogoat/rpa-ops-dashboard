import type { DateString, DateTimeString } from '../types/common';

/** 오늘 날짜를 KST 기준 "YYYY-MM-DD"로 돌려준다 (브라우저 시간대와 무관) */
export function getTodayKst(): DateString {
  // toISOString()은 UTC 기준이라, 9시간을 더한 시각을 넣어 KST 날짜를 얻는다
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "2026-09-24T06:00:00+09:00" → "2026-09-24 06:00". 명세상 항상 KST 오프셋이 붙어 오므로 문자열을 잘라 쓴다 */
export function formatDateTime(value: DateTimeString | null): string {
  return value === null ? '-' : value.slice(0, 16).replace('T', ' ');
}
