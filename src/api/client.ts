import type { ApiError } from '../types/common';

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

/**
 * 모든 API 요청이 지나가는 공통 함수: 요청 → 실패 확인 → JSON 변환.
 * 실패하면 화면에 그대로 보여줄 수 있는 한국어 메시지를 담은 Error를 던진다.
 * <T>는 응답 본문의 타입이다. 부르는 쪽이 정한다 (예: request<Summary>(…))
 */
async function request<T>(
  path: string,
  init: RequestInit | undefined,
  errorMessage: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    // 응답을 받지 못한 경우(네트워크 끊김 등). 브라우저의 영어 메시지("Failed to fetch") 대신 안내 문구를 쓴다
    throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
  }

  // fetch는 4xx·5xx 응답에도 예외를 던지지 않는다. 상태 코드를 직접 확인해서 오류로 바꾼다
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, errorMessage));
  }

  try {
    // res.json()의 반환 타입은 any다. 응답이 명세(T)대로 온다고 믿고 타입을 붙인다 (런타임 검증은 하지 않음)
    return (await res.json()) as T;
  } catch {
    // 성공 응답인데 본문이 JSON이 아닌 경우 (예: 목 API가 꺼져 있어 HTML이 온 경우)
    throw new Error(`${errorMessage} (응답 형식이 올바르지 않습니다)`);
  }
}

/**
 * GET 요청.
 * @param errorMessage 서버가 메시지를 주지 않았을 때 쓸 기본 문구 (예: '요약 조회 실패')
 */
export function apiGet<T>(path: string, errorMessage: string): Promise<T> {
  return request<T>(path, undefined, errorMessage);
}

/**
 * POST 요청. body는 JSON 문자열로 바꿔 보낸다.
 * @param errorMessage 서버가 메시지를 주지 않았을 때 쓸 기본 문구
 */
export function apiPost<T>(path: string, body: unknown, errorMessage: string): Promise<T> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
  return request<T>(path, init, errorMessage);
}

