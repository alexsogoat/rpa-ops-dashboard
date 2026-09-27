import type { RunStatus } from '../types/common';

// 명세 "실행 상태" 표의 화면 표시값.
// Record<RunStatus, string>이라 RunStatus에 값이 추가되면 여기를 채우기 전까지 컴파일 오류가 난다
const STATUS_LABEL: Record<RunStatus, string> = {
  success: '성공',
  failed: '실패',
  running: '실행 중',
};

interface StatusBadgeProps {
  /** 실행 상태. 실행 이력이 없으면 null */
  status: RunStatus | null;
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === null) {
    return <span className="badge badge-none">이력 없음</span>;
  }

  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export default StatusBadge;
