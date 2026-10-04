import { useState, type SubmitEvent } from 'react';
import { requestRerun } from '../api/processes';
import type { RerunResponse } from '../types/process';
import { formatDateTime, getTodayKst } from '../utils/format';

/** 제출 상태: 요청 전(idle) → 요청 중(submitting) → 접수(success) 또는 오류(error) */
type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; data: RerunResponse }
  | { status: 'error'; message: string };

interface RerunFormProps {
  /** 재실행할 프로세스 ID */
  processId: string;
}

/** 수기 재실행 폼: 기준일자를 입력해 재실행을 요청하고 결과(접수·오류)를 보여준다 */
function RerunForm({ processId }: RerunFormProps) {
  // 입력된 기준일자(YYYY-MM-DD). 처음에는 오늘 날짜
  const [baseDate, setBaseDate] = useState(getTodayKst());
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  // 폼이 제출되면(버튼 클릭 또는 Enter) 실행된다
  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    // 폼 제출의 기본 동작(페이지를 새로 불러옴)을 막는다. 막지 않으면 앱이 처음부터 다시 시작된다
    event.preventDefault();
    setSubmitState({ status: 'submitting' });

    try {
      const data = await requestRerun(processId, baseDate);
      setSubmitState({ status: 'success', data });
    } catch (error) {
      if (error instanceof Error) {
        setSubmitState({ status: 'error', message: error.message });
      } else {
        setSubmitState({ status: 'error', message: '알 수 없는 오류가 발생했습니다.' });
      }
    }
  };

  return (
    <div className="rerun">
      <form className="rerun-form" onSubmit={handleSubmit}>
        <label className="filter-field">
          {/* 날짜 칸의 표시 형식은 브라우저 언어를 따른다(영어면 mm/dd/yyyy). 그래서 선택한 값을 YYYY-MM-DD로 함께 보여준다 */}
          <span>기준일자 <strong className="field-value">{baseDate}</strong></span>
          {/* max: 달력에서 미래 날짜를 고를 수 없게 한다 (서버의 400 검사는 그대로 최종 방어선) */}
          <input
            type="date"
            required
            value={baseDate}
            onChange={(e) => setBaseDate(e.target.value)}
            max={getTodayKst()}
          />
        </label>

        {/* 요청 중에는 다시 누를 수 없게 한다 (중복 요청 방지) */}
        <button type="submit" className="button-primary" disabled={submitState.status === 'submitting'}>
          {submitState.status === 'submitting' ? '요청 중…' : '재실행 요청'}
        </button>
      </form>

      {/* 결과 표시: 접수(success)·오류(error)일 때만 그린다. idle·submitting은 아무것도 그리지 않는다 */}
      {submitState.status === 'success' && (
        <p className="notice-success" role="status">
          재실행 요청이 접수되었습니다. 실행 ID: {submitState.data.runId}, 기준일자:{' '}
          {submitState.data.baseDate}, 접수 시각: {formatDateTime(submitState.data.acceptedAt)}
          <br />
          {/* 접수 후 이력 표는 자동으로 갱신하지 않는다 (MVP 범위) → 사용자가 오해하지 않게 안내한다 */}
          실행 이력에는 화면을 다시 열면 표시됩니다.
        </p>
      )}
      {submitState.status === 'error' && (
        <p className="error" role="alert">
          {submitState.message}
        </p>
      )}
    </div>
  );
}

export default RerunForm;
