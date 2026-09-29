import type { TriggerType } from '../types/common';

// 명세 "실행 방식" 표의 화면 표시값
const TRIGGER_LABEL: Record<TriggerType, string> = {
  scheduled: '예약',
  manual: '수기',
};

interface TriggerChipProps {
  triggerType: TriggerType;
}

/** 실행 방식 칩 (예약/수기). 목록 표·이력 표·정보 카드에서 같이 쓴다 */
function TriggerChip({ triggerType }: TriggerChipProps) {
  return <span className={`chip chip-${triggerType}`}>{TRIGGER_LABEL[triggerType]}</span>;
}

export default TriggerChip;
