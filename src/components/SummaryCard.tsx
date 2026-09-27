interface SummaryCardProps {
  /** 카드 제목 (예: "오늘 실행") */
  label: string;
  /** 크게 표시할 값 (예: "128", "-") */
  value: string;
  /** 값 뒤에 작게 붙는 단위 (예: "건", "%") */
  unit?: string;
  /** 카드 아래 보조 설명 */
  hint?: string;
  /** 0~100. 값이 있으면 비율을 막대로 함께 표시한다 */
  meter?: number;
  /** 'danger'이면 카드 전체를 경고 색으로 강조한다 */
  tone?: 'default' | 'danger';
}

function SummaryCard({ label, value, unit, hint, meter, tone = 'default' }: SummaryCardProps) {
  return (
    <article className={tone === 'danger' ? 'summary-card danger' : 'summary-card'}>
      <p className="summary-card-label">{label}</p>
      <p className="summary-card-value">
        {value}
        {unit && <span className="summary-card-unit">{unit}</span>}
      </p>
      {/* 막대 길이는 CSS가 아니라 값에 따라 달라지므로 style 속성으로 넘긴다 */}
      {meter !== undefined && (
        <div className="meter" aria-hidden="true">
          <div className="meter-fill" style={{ width: `${meter}%` }} />
        </div>
      )}
      {hint && <p className="summary-card-hint">{hint}</p>}
    </article>
  );
}

export default SummaryCard;
