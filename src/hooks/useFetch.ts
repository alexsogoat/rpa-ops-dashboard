import { useEffect, useState } from 'react';

/** 조회 화면의 상태. 로딩·오류·성공 중 정확히 하나다. T는 성공했을 때 받는 데이터의 타입 */
export type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

/** 캐시에 둔 응답을 바로 보여 줄 수 있는 최대 나이. 이보다 오래된 응답은 쓰지 않고 로딩부터 다시 한다 */
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  /** 응답을 받은 시각 (Date.now()) */
  savedAt: number;
}

/**
 * 마지막으로 받은 응답. 키는 요청 경로(예: '/api/processes')다.
 * 모듈 변수라 화면을 이동해도 남고, 새로고침하면 비워진다 (MSW 목 데이터가 초기화되는 시점과 같다)
 */
const cache = new Map<string, CacheEntry>();

/** 5분 이내에 받은 응답이 있으면 돌려준다. 렌더링 중에 부르므로 읽기만 한다 */
function readCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.savedAt > CACHE_MAX_AGE_MS) return undefined;
  // Map에는 여러 응답 타입이 섞여 있어 unknown으로 둔다. 같은 key에는 같은 fetcher의 결과만 저장하므로 T로 되돌린다
  return entry.data as T;
}

/**
 * 화면이 나타나면 fetcher를 호출하고, 결과를 FetchState로 돌려준다.
 * 같은 key로 받아 둔 응답이 있으면 로딩 없이 먼저 보여 주고, 뒤에서 다시 받아 최신 값으로 바꾼다 (stale-while-revalidate).
 * 이전 호출의 늦은 응답은 화면에 반영하지 않는다.
 *
 * - key: 응답을 구분하는 이름. 요청 경로를 그대로 쓴다 (예: `/api/processes/${id}`).
 *   처음 그릴 때만 캐시를 확인하므로, key가 바뀌는 화면은 컴포넌트를 새로 만든다 (상세 화면의 `key={id}`)
 * - fetcher: 렌더링마다 새로 만들어지면 안 된다. 컴포넌트 밖에 선언된 함수(getSummary)나
 *   useCallback으로 감싼 함수를 넘긴다. 매번 새 함수를 넘기면 effect가 매 렌더링마다 실행되어 요청이 반복된다.
 */
export function useFetch<T>(key: string, fetcher: () => Promise<T>): FetchState<T> {
  // useState에 함수를 넘기면 첫 렌더링 때 한 번만 실행된다 → 캐시가 있으면 처음부터 성공 상태로 그린다
  const [state, setState] = useState<FetchState<T>>(() => {
    const cached = readCache<T>(key);
    return cached === undefined ? { status: 'loading' } : { status: 'success', data: cached };
  });

  useEffect(() => {
    // StrictMode(개발 모드)에서는 effect가 두 번 실행된다. 이미 정리된 effect의 응답은 무시한다
    let ignore = false;

    fetcher()
      .then((data) => {
        // 화면이 이미 사라졌어도 받은 응답은 최신 값이므로 캐시에는 저장한다
        cache.set(key, { data, savedAt: Date.now() });
        if (!ignore) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        // 다시 받다가 실패하면 옛 응답 대신 오류를 보여 주고, 다음에도 옛 응답을 쓰지 않도록 지운다
        cache.delete(key);
        if (!ignore) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
          setState({ status: 'error', message });
        }
      });

    return () => {
      ignore = true;
    };
  }, [key, fetcher]);

  return state;
}
