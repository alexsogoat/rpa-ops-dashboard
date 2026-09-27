import type { Summary } from '../types/summary';

/** GET /api/summary — 오늘 요약 */
export async function getSummary(): Promise<Summary> {
  const res = await fetch('/api/summary');

  // fetch는 4xx·5xx 응답에도 예외를 던지지 않는다. 상태 코드를 직접 확인해서 오류로 바꾼다
  if (!res.ok) {
    throw new Error(`요약 조회 실패 (HTTP ${res.status})`);
  }

  // res.json()의 반환 타입은 any다. 응답이 명세(Summary)대로 온다고 믿고 타입을 붙인다 (런타임 검증은 하지 않음)
  return (await res.json()) as Summary;
}
