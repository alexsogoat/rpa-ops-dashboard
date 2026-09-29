import type { ProcessDetail } from '../types/process';
import { formatDateTime } from '../utils/format';
import StatusBadge from './StatusBadge';
import TriggerChip from './TriggerChip';

interface ProcessInfoProps {
  detail: ProcessDetail;
}

/** 프로세스 정보 카드: 이름·최근 상태·설명과 속성 목록 */
function ProcessInfo({ detail }: ProcessInfoProps) {
  return (
    <div className="info-card">
      <div className="info-card-header">
        <p className="info-card-title">{detail.name}</p>
        <StatusBadge status={detail.lastStatus} />
      </div>
      <p className="info-card-desc">{detail.description}</p>

      {/* dl: 항목명(dt)과 값(dd) 쌍의 목록을 나타내는 HTML 태그 */}
      <dl className="info-grid">
        <div>
          <dt>ID</dt>
          <dd className="cell-id">{detail.id}</dd>
        </div>
        <div>
          <dt>담당 부서</dt>
          <dd>{detail.department}</dd>
        </div>
        <div>
          <dt>실행 방식</dt>
          <dd>
            <TriggerChip triggerType={detail.triggerType} />
          </dd>
        </div>
        <div>
          <dt>예약 주기</dt>
          {/* 수기 실행 프로세스는 schedule이 null (명세 3번) */}
          <dd>{detail.schedule ?? '-'}</dd>
        </div>
        <div>
          <dt>최근 실행</dt>
          <dd className="cell-time">{formatDateTime(detail.lastRunAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default ProcessInfo;
