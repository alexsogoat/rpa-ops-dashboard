import type { Summary } from '../types/summary';
import { apiGet } from './client';

/** GET /api/summary — 오늘 요약 */
export function getSummary(): Promise<Summary> {
  // 상태 코드 확인·오류 메시지·JSON 변환은 apiGet(client.ts)이 맡는다. 여기에는 "어디로, 무엇을 받는지"만 남는다
  return apiGet<Summary>('/api/summary', '요약 조회 실패');
}
