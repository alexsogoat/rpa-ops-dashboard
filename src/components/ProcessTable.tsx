import type { DateTimeString, TriggerType } from '../types/common';
import type { Process } from '../types/process';
import StatusBadge from './StatusBadge';

// 명세 "실행 방식" 표의 화면 표시값
const TRIGGER_LABEL: Record<TriggerType, string> = {
  scheduled: '예약',
  manual: '수기',
};

/** "2026-09-24T06:00:00+09:00" → "2026-09-24 06:00". 명세상 항상 KST 오프셋이 붙어 오므로 문자열을 잘라 쓴다 */
function formatDateTime(value: DateTimeString | null): string {
  return value === null ? '-' : value.slice(0, 16).replace('T', ' ');
}

interface ProcessTableProps {
  processes: Process[];
}

function ProcessTable({ processes }: ProcessTableProps) {
  return (
    <div className="table-wrap">
      <table className="process-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">프로세스명</th>
            <th scope="col">담당 부서</th>
            <th scope="col">실행 방식</th>
            <th scope="col">최근 상태</th>
            <th scope="col">최근 실행</th>
          </tr>
        </thead>
        <tbody>
          {/* key: React가 행을 구분하는 값. 목록 안에서 겹치지 않는 id를 쓴다 */}
          {processes.map((item) => (
            <tr key={item.id}>
              <td className="mono">{item.id}</td>
              <td>{item.name}</td>
              <td>{item.department}</td>
              <td>{TRIGGER_LABEL[item.triggerType]}</td>
              <td>
                <StatusBadge status={item.lastStatus} />
              </td>
              <td>{formatDateTime(item.lastRunAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProcessTable;
