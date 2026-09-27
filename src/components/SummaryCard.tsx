interface SummaryCardProps {
  /** 카드 제목 (예: "오늘 실행") */
  label: string;
  /** 화면에 그대로 표시할 값, 단위 포함 (예: "128건") */
  value: string;
  /** 'danger'이면 값을 경고 색으로 강조한다 */
  tone?: 'default' | 'danger';
}

function SummaryCard({ label, value, tone = 'default' }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <p className="summary-card-label">{label}</p>
      <p className={tone === 'danger' ? 'summary-card-value danger' : 'summary-card-value'}>
        {value}
      </p>
    </article>
  );
}

export default SummaryCard;
