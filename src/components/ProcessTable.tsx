import { Link } from 'react-router';
import type { Process } from '../types/process';
import { formatDateTime } from '../utils/format';
import StatusBadge from './StatusBadge';
import TriggerChip from './TriggerChip';

interface ProcessTableProps {
  processes: Process[];
}

function ProcessTable({ processes }: ProcessTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table">
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
            // 최근 실행이 실패한 행은 row-failed 클래스로 강조한다
            <tr key={item.id} className={item.lastStatus === 'failed' ? 'row-failed' : undefined}>
              <td className="cell-id">{item.id}</td>
              <td className="cell-name">
                {/* <a href>와 달리 페이지를 새로 받지 않고 URL과 화면만 바꾼다 */}
                <Link to={`/processes/${item.id}`}>{item.name}</Link>
              </td>
              <td className="cell-muted">{item.department}</td>
              <td>
                <TriggerChip triggerType={item.triggerType} />
              </td>
              <td>
                <StatusBadge status={item.lastStatus} />
              </td>
              <td className="cell-time">{formatDateTime(item.lastRunAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProcessTable;
