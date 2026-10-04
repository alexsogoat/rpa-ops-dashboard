import type { DateString } from '../types/common';
import type { Process, ProcessDetail, RerunRequest, RerunResponse, Run } from '../types/process';
import { apiGet, apiPost } from './client';

/** GET /api/processes — 프로세스 목록 (최근 실행 상태 포함) */
export function getProcesses(): Promise<Process[]> {
  return apiGet<Process[]>('/api/processes', '프로세스 목록 조회 실패');
}

/** GET /api/processes/{id} — 프로세스 상세. 없는 id면 서버 메시지(404)로 실패한다 */
export function getProcessDetail(id: string): Promise<ProcessDetail> {
  // id는 주소창에서 온 값이라 '/'·'?' 같은 문자가 섞일 수 있다 → URL 한 칸에 안전하게 넣는다
  return apiGet<ProcessDetail>(
    `/api/processes/${encodeURIComponent(id)}`,
    '프로세스 상세 조회 실패',
  );
}

/** GET /api/processes/{id}/runs — 실행 이력 (최신순 최대 20건). 없는 id면 서버 메시지(404)로 실패한다 */
export function getProcessRuns(id: string): Promise<Run[]> {
  return apiGet<Run[]>(
    `/api/processes/${encodeURIComponent(id)}/runs`,
    '프로세스 실행 이력 조회 실패',
  );
}

/** POST /api/processes/{id}/runs — 수기 재실행 요청. 접수(202)되면 접수 정보를, 400·404·409면 서버 메시지로 실패한다 */
export function requestRerun(id: string, baseDate: DateString): Promise<RerunResponse> {
  // 본문에 명세 타입을 붙여 둔다. 명세의 필드 이름이 바뀌면 여기서 컴파일 오류로 알 수 있다
  const body: RerunRequest = { baseDate };

  return apiPost<RerunResponse>(
    `/api/processes/${encodeURIComponent(id)}/runs`,
    body,
    '프로세스 재실행 요청 실패',
  );
}
