import type { RunStatus, TriggerType } from '../types/common';

/** 상태 필터 값. 'all'은 전체, 'none'은 실행 이력 없음(lastStatus가 null) */
export type StatusFilter = RunStatus | 'none' | 'all';

/** 실행 방식 필터 값. 'all'은 전체 */
export type TriggerFilter = TriggerType | 'all';

interface ProcessFilterBarProps {
  /** 지금 선택된 상태 */
  status: StatusFilter;
  /** 지금 선택된 실행 방식 */
  triggerType: TriggerFilter;
  /** 지금 입력된 검색어 */
  keyword: string;
  /** 상태 선택이 바뀌면 새 값을 부모에게 알린다 */
  onStatusChange: (value: StatusFilter) => void;
  /** 실행 방식 선택이 바뀌면 새 값을 부모에게 알린다 */
  onTriggerTypeChange: (value: TriggerFilter) => void;
  /** 검색어가 바뀌면 새 값을 부모에게 알린다 */
  onKeywordChange: (value: string) => void;
}

// 값(status·triggerType·keyword)은 부모가 정하고, 바뀐 값은 on…Change로 부모에게 돌려준다 (controlled input)
function ProcessFilterBar({
  status,
  triggerType,
  keyword,
  onStatusChange,
  onTriggerTypeChange,
  onKeywordChange,
}: ProcessFilterBarProps) {
  return (
    <div className="filter-bar">
      <label className="filter-field">
        <span>상태</span>
        {/* e.target.value는 string이지만 option 값이 모두 StatusFilter 값이라 as로 단언해도 안전하다 */}
        <select value={status} onChange={(e) => onStatusChange(e.target.value as StatusFilter)}>
          <option value="all">전체</option>
          <option value="success">성공</option>
          <option value="failed">실패</option>
          <option value="running">실행 중</option>
          <option value="none">이력 없음</option>
        </select>
      </label>

      <label className="filter-field">
        <span>실행 방식</span>
        <select value={triggerType} onChange={(e) => onTriggerTypeChange(e.target.value as TriggerFilter)}>
          <option value="all">전체</option>
          <option value="scheduled">예약</option>
          <option value="manual">수기</option>
        </select>
      </label>

      <label className="filter-field filter-field-grow">
        <span>프로세스명 검색</span>
        <input type="search" value={keyword} onChange={(e) => onKeywordChange(e.target.value)} placeholder="예: 재고" />
      </label>
    </div>
  );
}

export default ProcessFilterBar;
