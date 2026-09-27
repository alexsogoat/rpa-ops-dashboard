import { useEffect, useState } from 'react';
import { getSummary } from '../api/summary';
import SummaryCard from '../components/SummaryCard';
import type { Summary } from '../types/summary';

/** 요약 영역의 화면 상태. 로딩·오류·성공 중 정확히 하나다 */
type SummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Summary };

function DashboardPage() {
  const [summaryState, setSummaryState] = useState<SummaryState>({ status: 'loading' });

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

  return (
    <main className="container">
      <header className="page-header">
        <h1>RPA 운영 대시보드</h1>
        <p className="muted">MSW 목 API 데모 · 모든 데이터는 가상입니다</p>
      </header>

      <section aria-labelledby="summary-title">
        <h2 id="summary-title">오늘 요약</h2>
        <SummaryContent state={summaryState} />
      </section>
    </main>
  );
}

/** 상태에 따라 로딩 문구·오류 문구·카드 3개 중 하나를 그린다 */
function SummaryContent({ state }: { state: SummaryState }) {
  if (state.status === 'loading') {
    return <p className="muted">요약을 불러오는 중…</p>;
  }

  if (state.status === 'error') {
    return <p className="error" role="alert">요약을 불러오지 못했습니다. ({state.message})</p>;
  }

  // 여기서는 status가 'success'로 좁혀져서 state.data를 쓸 수 있다
  const { date, totalRuns, successRate, errorCount } = state.data;

  return (
    <>
      <div className="summary-cards">
        <SummaryCard label="오늘 실행" value={`${totalRuns}건`} />
        {/* 완료된 실행이 없으면 successRate가 null → 명세대로 '-' 표시 */}
        <SummaryCard label="성공률" value={successRate === null ? '-' : `${successRate}%`} />
        <SummaryCard
          label="오류"
          value={`${errorCount}건`}
          tone={errorCount > 0 ? 'danger' : 'default'}
        />
      </div>
      <p className="muted">
        기준일 {date} (KST)
        {totalRuns === 0 && ' · 오늘은 아직 실행된 프로세스가 없습니다'}
      </p>
    </>
  );
}

export default DashboardPage;
