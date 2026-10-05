import { getProcesses } from '../api/processes';
import { getSummary } from '../api/summary';
import FilterableProcessList from '../components/FilterableProcessList';
import SummaryCard from '../components/SummaryCard';
import { useFetch, type FetchState } from '../hooks/useFetch';
import type { Process } from '../types/process';
import type { Summary } from '../types/summary';

type SummaryState = FetchState<Summary>;
type ProcessListState = FetchState<Process[]>;

function DashboardPage() {
  // 요청·로딩·오류·성공 상태는 useFetch가 관리한다. 두 요청은 서로 기다리지 않고 독립적으로 동작한다
  const summaryState = useFetch(getSummary);
  const processListState = useFetch(getProcesses);

  // 상단 바는 모든 화면 공통이라 App.tsx에 있다
  return (
    <main className="container">
      <section aria-labelledby="summary-title">
        <div className="section-header">
          <h2 id="summary-title">오늘 요약</h2>
          {summaryState.status === 'success' && (
            <span className="section-meta">기준일 {summaryState.data.date} (KST)</span>
          )}
        </div>
        <SummaryContent state={summaryState} />
      </section>

      <section aria-labelledby="process-list-title">
        <div className="section-header">
          <h2 id="process-list-title">프로세스 목록</h2>
          {processListState.status === 'success' && (
            <span className="section-meta">{processListState.data.length}개</span>
          )}
        </div>
        <ProcessListContent state={processListState} />
      </section>
    </main>
  );
  };

/** 상태에 따라 로딩 문구·오류 문구·카드 3개 중 하나를 그린다 */
function SummaryContent({ state }: { state: SummaryState }) {
  if (state.status === 'loading') {
    return <p className="loading">요약을 불러오는 중…</p>;
  }

  if (state.status === 'error') {
    return <p className="error" role="alert">요약을 불러오지 못했습니다. ({state.message})</p>;
  }

  // 여기서는 status가 'success'로 좁혀져서 state.data를 쓸 수 있다
  const { totalRuns, successRate, errorCount } = state.data;

  return (
    <>
      <div className="summary-cards">
        <SummaryCard label="오늘 실행" value={String(totalRuns)} unit="건" hint="실행 중인 건 포함" />
        {/* 완료된 실행이 없으면 successRate가 null → 명세대로 '-'만 표시하고 단위·막대는 뺀다 */}
        {successRate === null ? (
          <SummaryCard label="성공률" value="-" hint="완료된 실행 기준" />
        ) : (
          <SummaryCard
            label="성공률"
            value={String(successRate)}
            unit="%"
            meter={successRate}
            hint="완료된 실행 기준"
          />
        )}
        <SummaryCard
          label="오류"
          value={String(errorCount)}
          unit="건"
          hint="오늘 실패한 실행"
          tone={errorCount > 0 ? 'danger' : 'default'}
        />
      </div>
      {totalRuns === 0 && <p className="muted">오늘은 아직 실행된 프로세스가 없습니다.</p>}
    </>
  );
}

/** 상태에 따라 로딩 문구·오류 문구·빈 목록 문구·표 중 하나를 그린다 */
function ProcessListContent({ state }: { state: ProcessListState }) {
  if (state.status === 'loading') {
    return <p className="loading">목록을 불러오는 중…</p>;
  }

  if (state.status === 'error') {
    return <p className="error" role="alert">목록을 불러오지 못했습니다. ({state.message})</p>;
  }

  if (state.data.length === 0) {
    return <p className="empty">등록된 프로세스가 없습니다.</p>;
  }

  return <FilterableProcessList processes={state.data} />;
}

export default DashboardPage;
