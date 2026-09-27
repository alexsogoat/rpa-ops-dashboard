import type { Process } from '../types/process';

/** GET /api/processes — 프로세스 목록 (최근 실행 상태 포함) */
export async function getProcesses(): Promise<Process[]> {
  const res = await fetch('/api/processes');

  if (!res.ok) {
    throw new Error(`프로세스 목록 조회 실패 (HTTP ${res.status})`);
  }

  // getSummary와 같은 이유: 응답이 명세(Process[])대로 온다고 믿고 타입을 붙인다
  return (await res.json()) as Process[];
}
