import type { ErrorType } from '../types/common';
import type { Run } from '../types/process';
import { formatDateTime } from '../utils/format';
import StatusBadge from './StatusBadge';
import TriggerChip from './TriggerChip';

// 명세 "오류 유형" 표의 화면 표시값
const ERROR_TYPE_LABEL: Record<ErrorType, string> = {
  timeout: '시간 초과',
  element_not_found: '화면 요소 없음',
  login_failed: '로그인 실패',
  data_error: '데이터 오류',
  system_error: '시스템 오류',
};

interface RunTableProps {
  /** 실행 이력 (서버가 최신순으로 준다) */
  runs: Run[];
}

/** 실행 이력과 오류를 한 표로 보여준다. 실패한 행은 오류 유형·메시지·발생 시각을 함께 표시한다 */
function RunTable({ runs }: RunTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">실행 ID</th>
            <th scope="col">상태</th>
            <th scope="col">실행 방식</th>
            <th scope="col">기준일자</th>
            <th scope="col">시작</th>
            <th scope="col">종료</th>
            <th scope="col">오류</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className={run.status === 'failed' ? 'row-failed' : undefined}>
              <td className="cell-id">{run.id}</td>
              <td>
                <StatusBadge status={run.status} />
              </td>
              <td>
                <TriggerChip triggerType={run.triggerType} />
              </td>
              <td className="cell-time">{run.baseDate}</td>
              <td className="cell-time">{formatDateTime(run.startedAt)}</td>
              {/* 실행 중이면 endedAt이 null → '-' */}
              <td className="cell-time">{formatDateTime(run.endedAt)}</td>
              <td className="cell-error">
                {/* error는 실패한 실행에만 있다. null이면 '-' */}
                {run.error === null ? (
                  <span className="cell-muted">-</span>
                ) : (
                  <>
                    <span className="error-type">{ERROR_TYPE_LABEL[run.error.type]}</span>
                    {run.error.message}
                    <span className="error-time">발생 {formatDateTime(run.error.occurredAt)}</span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RunTable;
