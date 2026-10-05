import { useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { getProcessDetail, getProcessRuns } from '../api/processes';
import ProcessInfo from '../components/ProcessInfo';
import RerunForm from '../components/RerunForm';
import RunTable from '../components/RunTable';
import { useFetch, type FetchState } from '../hooks/useFetch';
import type { ProcessDetail, Run } from '../types/process';

type DetailState = FetchState<ProcessDetail>;

type RunsState = FetchState<Run[]>;

function ProcessDetailPage() {
  // URL /processes/PRC-001 → id === 'PRC-001'
  // 타입 인자 'id'로 꺼낼 수 있는 키를 정한다. 값 타입은 string | undefined다
  const { id } = useParams<'id'>();

  // useFetch에 넘기는 함수는 id가 같은 동안 "같은 함수"여야 한다. 렌더링마다 새로 만들면 요청이 계속 반복된다.
  // useCallback이 id가 바뀔 때만 함수를 새로 만들어 준다 (두 번째 인자 [id]가 그 기준)
  const fetchDetail = useCallback(() => {
    if (!id) return Promise.reject(new Error('프로세스 ID가 없습니다.'));
    return getProcessDetail(id);
  }, [id]);
  const detailState = useFetch(fetchDetail);

  const fetchRuns = useCallback(() => {
    if (!id) return Promise.reject(new Error('프로세스 ID가 없습니다.'));
    return getProcessRuns(id);
  }, [id]);
  const runsState = useFetch(fetchRuns);

  return (
    <main className="container">
      <Link to="/" className="back-link">
        ← 목록으로
      </Link>

      <section aria-labelledby="detail-title">
        <div className="section-header">
          <h2 id="detail-title">프로세스 정보</h2>
          <span className="section-meta">{id}</span>
        </div>
        <DetailContent state={detailState} />
      </section>

      {/* 프로세스가 확인된 뒤에만 재실행 폼을 보여준다 (없는 id·로딩 중에는 요청할 대상이 없다) */}
      {detailState.status === 'success' && (
        <section aria-labelledby="rerun-title">
          <div className="section-header">
            <h2 id="rerun-title">수기 재실행</h2>
            <span className="section-meta">기준일자를 지정해 다시 실행합니다</span>
          </div>
          {/* key: 프로세스가 바뀌면 폼을 새로 만들어 이전 프로세스의 입력·결과가 남지 않게 한다 */}
          <RerunForm key={detailState.data.id} processId={detailState.data.id} />
        </section>
      )}

      <section aria-labelledby="runs-title">
        <div className="section-header">
          <h2 id="runs-title">실행 이력</h2>
          <span className="section-meta">최근 20건</span>
        </div>
        <RunsContent state={runsState} />
      </section>
    </main>
  );
}

/** 상태에 따라 로딩 문구·오류 문구·정보 카드 중 하나를 그린다 */
function DetailContent({ state }: { state: DetailState }) {
  if (state.status === 'loading') return <p className="loading">프로세스 정보를 불러오는 중…</p>;
  // 없는 id면 서버 메시지("프로세스를 찾을 수 없습니다: …")가 그대로 표시된다
  if (state.status === 'error') return <p className="error" role="alert">{state.message}</p>;

  return <ProcessInfo detail={state.data} />;
}

/** 상태에 따라 로딩 문구·오류 문구·빈 이력 문구·이력 표 중 하나를 그린다 */
function RunsContent({ state }: { state: RunsState }) {
  if (state.status === 'loading') return <p className="loading">실행 이력을 불러오는 중…</p>;
  if (state.status === 'error') return <p className="error" role="alert">{state.message}</p>;
  if (state.data.length === 0) return <p className="empty">실행 이력이 없습니다.</p>;

  return <RunTable runs={state.data} />;
}

export default ProcessDetailPage;
