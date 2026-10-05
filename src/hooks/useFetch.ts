import { useEffect, useState } from 'react';

/** 조회 화면의 상태. 로딩·오류·성공 중 정확히 하나다. T는 성공했을 때 받는 데이터의 타입 */
export type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

/**
 * 화면이 나타나면 fetcher를 한 번 호출하고, 결과를 FetchState로 돌려준다.
 * fetcher가 바뀌면(예: 다른 id) 다시 호출한다. 이전 호출의 늦은 응답은 무시한다.
 *
 * 주의: fetcher는 렌더링마다 새로 만들어지면 안 된다. 컴포넌트 밖에 선언된 함수(getSummary)나
 * useCallback으로 감싼 함수를 넘긴다. 매번 새 함수를 넘기면 effect가 매 렌더링마다 실행되어 요청이 반복된다.
 */
export function useFetch<T>(fetcher: () => Promise<T>): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' });

  useEffect(() => {
    // StrictMode(개발 모드)에서는 effect가 두 번 실행된다. 이미 정리된 effect의 응답은 무시한다
    let ignore = false;

    fetcher()
      .then((data) => {
        if (!ignore) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
          setState({ status: 'error', message });
        }
      });

    return () => {
      ignore = true;
    };
  }, [fetcher]);

  return state;
}
