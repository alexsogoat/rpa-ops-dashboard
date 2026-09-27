import { useState } from 'react';
import type { Process } from '../types/process';
import ProcessFilterBar from './ProcessFilterBar';
import type { StatusFilter, TriggerFilter } from './ProcessFilterBar';
import ProcessTable from './ProcessTable';

interface FilterableProcessListProps {
  /** 서버에서 받은 전체 목록 */
  processes: Process[];
}

/**
 * 필터 바 + 필터가 적용된 표.
 * 필터 바와 표가 같은 필터 값을 써야 하므로, 두 컴포넌트의 공통 부모인 여기서 상태를 관리한다.
 */
function FilterableProcessList({ processes }: FilterableProcessListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all');
  const [keyword, setKeyword] = useState<string>('');

  // 필터 결과는 상태로 만들지 않는다. 렌더링할 때마다 계산하는 값이다
  const visibleProcesses = processes.filter((item) => {
    // '이력 없음'은 lastStatus가 null인 항목이다. 'none' 문자열과 직접 비교하면 항상 false가 된다
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'none' ? item.lastStatus === null : item.lastStatus === statusFilter);
    const matchesTrigger = triggerFilter === 'all' || item.triggerType === triggerFilter;
    // 앞뒤 공백을 뺀 검색어. 빈 문자열이면 includes('')가 true라서 모두 통과한다
    const matchesKeyword = item.name.includes(keyword.trim());
    return matchesStatus && matchesTrigger && matchesKeyword;
  });

  return (
    <>
      <ProcessFilterBar
        status={statusFilter}
        onStatusChange={setStatusFilter}
        triggerType={triggerFilter}
        onTriggerTypeChange={setTriggerFilter}
        keyword={keyword}
        onKeywordChange={setKeyword}
      />

      <p className="filter-result">
        {visibleProcesses.length}개 표시 · 전체 {processes.length}개
      </p>

      {visibleProcesses.length === 0 ? <p className="empty">조건에 맞는 프로세스가 없습니다.</p> : <ProcessTable processes={visibleProcesses} />}
    </>
  );
}

export default FilterableProcessList;
