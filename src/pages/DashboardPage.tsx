import { useEffect, useState } from 'react';
import { getProcesses } from '../api/processes';
import { getSummary } from '../api/summary';
import ProcessTable from '../components/ProcessTable';
import SummaryCard from '../components/SummaryCard';
import type { Process } from '../types/process';
import type { Summary } from '../types/summary';

/** 요약 영역의 화면 상태. 로딩·오류·성공 중 정확히 하나다 */
type SummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Summary };

/** 목록 영역의 화면 상태. SummaryState와 data 타입만 다르다 */
type ProcessListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Process[] };

function DashboardPage() {
  const [summaryState, setSummaryState] = useState<SummaryState>({ status: 'loading' });
  const [processListState, setProcessListState] = useState<ProcessListState>({
    status: 'loading',
  });

  // 의존성 배열이 []이므로 화면이 처음 그려진 뒤 한 번만 요청한다
  useEffect(() => {
    // StrictMode(개발 모드)에서는 effect가 두 번 실행된다. 이미 정리된 effect의 응답은 무시한다
    let ignore = false;

    getSummary()
      .then((data) => {
        if (!ignore) setSummaryState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류';
          setSummaryState({ status: 'error', message });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // 요약 effect와 같은 패턴이다. 두 요청은 서로 기다리지 않고, 한쪽이 실패해도 다른 쪽은 표시된다
  // (반복되는 부분은 공통화 리팩터링 때 커스텀 훅으로 묶는다)
  useEffect(() => {
    let ignore = false;

    getProcesses()
      .then((data) => {
        if (!ignore) setProcessListState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류';
          setProcessListState({ status: 'error', message });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <header className="app-bar">
        <div className="app-bar-inner">
          <span className="app-logo" aria-hidden="true">
            R
          </span>
          <h1>RPA 운영 대시보드</h1>
          <span className="demo-badge">MSW 목 API 데모</span>
          <span className="app-bar-note">모든 데이터는 가상입니다</span>
        </div>
      </header>

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
    </>
  );
}

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

  return <ProcessTable processes={state.data} />;
}

export default DashboardPage;
