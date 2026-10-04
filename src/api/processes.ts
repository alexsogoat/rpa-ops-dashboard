import type { ApiError, DateString } from '../types/common';
import type { Process, ProcessDetail, RerunRequest, RerunResponse, Run } from '../types/process';

/**
 * 실패 응답(4xx·5xx)에서 화면에 보여줄 메시지를 꺼낸다.
 * 본문이 명세의 오류 형식({ code, message })이면 서버 message를, 아니면 기본 문구 + HTTP 상태 코드를 쓴다.
 */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    // 실패 응답의 본문은 믿을 수 없으므로 "필드가 없을 수도 있는" Partial로만 보고 직접 확인한다
    const body = (await res.json()) as Partial<ApiError>;
    if (typeof body.message === 'string') return body.message;
  } catch {
    // 본문이 JSON이 아니면(예: HTML 오류 페이지) 아래 기본 문구를 쓴다
  }
  return `${fallback} (HTTP ${res.status})`;
}

/** GET /api/processes — 프로세스 목록 (최근 실행 상태 포함) */
export async function getProcesses(): Promise<Process[]> {
  const res = await fetch('/api/processes');

  if (!res.ok) {
    throw new Error(`프로세스 목록 조회 실패 (HTTP ${res.status})`);
  }

  // getSummary와 같은 이유: 응답이 명세(Process[])대로 온다고 믿고 타입을 붙인다
  return (await res.json()) as Process[];
}

/** GET /api/processes/{id} — 프로세스 상세. 없는 id면 서버 메시지(404)로 실패한다 */
export async function getProcessDetail(id: string): Promise<ProcessDetail> {
  // id는 주소창에서 온 값이라 '/'·'?' 같은 문자가 섞일 수 있다 → URL 한 칸에 안전하게 넣는다
  const res = await fetch(`/api/processes/${encodeURIComponent(id)}`);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, '프로세스 상세 조회 실패'));
  }

  return (await res.json()) as ProcessDetail;
}

/** GET /api/processes/{id}/runs — 실행 이력 (최신순 최대 20건). 없는 id면 서버 메시지(404)로 실패한다 */
export async function getProcessRuns(id: string): Promise<Run[]> {
  const res = await fetch(`/api/processes/${encodeURIComponent(id)}/runs`);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, '프로세스 실행 이력 조회 실패'));
  }

  return (await res.json()) as Run[];
}

/** POST /api/processes/{id}/runs — 수기 재실행 요청. 접수(202)되면 접수 정보를, 400·404·409면 서버 메시지로 실패한다 */
export async function requestRerun(id: string, baseDate: DateString): Promise<RerunResponse> {
  // 본문에 명세 타입을 붙여 둔다. 명세의 필드 이름이 바뀌면 여기서 컴파일 오류로 알 수 있다
  const body: RerunRequest = { baseDate };

  const res = await fetch(`/api/processes/${encodeURIComponent(id)}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, '프로세스 재실행 요청 실패'));
  }

  return (await res.json()) as RerunResponse;
}
