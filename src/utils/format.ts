import type { DateTimeString } from '../types/common';

/** "2026-09-24T06:00:00+09:00" → "2026-09-24 06:00". 명세상 항상 KST 오프셋이 붙어 오므로 문자열을 잘라 쓴다 */
export function formatDateTime(value: DateTimeString | null): string {
  return value === null ? '-' : value.slice(0, 16).replace('T', ' ');
}
