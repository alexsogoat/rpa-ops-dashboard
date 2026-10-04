// 가상 데이터. 날짜는 고정값이 아니라 워커가 시작된 시각(now) 기준 상대값으로 만든다.
// 새로고침하면 다시 만들어지므로 상태도 초기화된다.
import type { DateString, ErrorType, RunStatus, TriggerType } from '../types/common';
import type { Process, ProcessDetail, Run } from '../types/process';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;

/** Date → "2026-09-24T09:30:00+09:00" (브라우저 시간대와 무관하게 KST) */
export function toKstDateTime(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET).toISOString().slice(0, 19) + '+09:00';
}

/** Date → "2026-09-24" (KST) */
export function toKstDate(date: Date): string {
  return toKstDateTime(date).slice(0, 10);
}

// ─── 프로세스 기본 정보 ─────────────────────────────
// lastStatus·lastRunAt은 실행 이력에서 계산하므로 여기서는 뺀다
type ProcessBase = Omit<ProcessDetail, 'lastStatus' | 'lastRunAt'>;

const processBases: ProcessBase[] = [
  { id: 'PRC-001', name: '매장 일일 매출 집계', department: '영업관리팀', triggerType: 'scheduled', schedule: '매일 06:00', description: '전 매장 POS 매출을 집계해 영업관리팀 공유 폴더에 일일 리포트로 저장한다.' },
  { id: 'PRC-002', name: '재고 동기화', department: '물류팀', triggerType: 'scheduled', schedule: '매시 정각', description: '물류센터 WMS 재고를 온라인몰 재고와 동기화한다.' },
  { id: 'PRC-003', name: '온라인몰 주문 수집', department: '온라인사업팀', triggerType: 'scheduled', schedule: '매일 07:00, 13:00', description: '외부 온라인몰 판매 채널의 신규 주문을 수집해 주문관리시스템에 등록한다.' },
  { id: 'PRC-004', name: '거래처 정산서 발송', department: '재무팀', triggerType: 'scheduled', schedule: '매월 말일 18:00', description: '거래처별 월 정산서를 생성해 담당자에게 메일로 발송한다.' },
  { id: 'PRC-005', name: '법인카드 사용 내역 수집', department: '재무팀', triggerType: 'scheduled', schedule: '매일 08:00', description: '카드사 사이트에서 전일 법인카드 사용 내역을 내려받아 ERP에 업로드한다.' },
  { id: 'PRC-006', name: '매장 근태 마감', department: '인사팀', triggerType: 'scheduled', schedule: '매일 23:00', description: '매장 직원의 당일 출퇴근 기록을 마감하고 누락 건을 점장에게 알린다.' },
  { id: 'PRC-007', name: '신규 입사자 계정 생성', department: '인사팀', triggerType: 'manual', schedule: null, description: '입사 확정자의 메일·그룹웨어·ERP 계정을 일괄 생성한다.' },
  { id: 'PRC-008', name: '반품 입고 처리', department: '물류팀', triggerType: 'manual', schedule: null, description: '매장 반품 요청 건을 물류센터 입고 예정으로 등록한다.' },
];

// ─── 실행 이력 ─────────────────────────────────────
interface RunSeed {
  /** 몇 분 전에 시작했는지 */
  startedMinAgo: number;
  status: RunStatus;
  /** 걸린 시간(분). running이면 무시 */
  durationMin?: number;
  /** 기본값 'scheduled' */
  triggerType?: TriggerType;
  /** 기준일자가 시작일보다 며칠 전인지 (수기 재실행용). 기본값 0 */
  baseDaysBefore?: number;
  error?: { type: ErrorType; message: string };
}

const now = new Date();
let runSeq = 0;

function makeRun(seed: RunSeed): Run {
  const startedAt = new Date(now.getTime() - seed.startedMinAgo * MINUTE);
  const endedAt =
    seed.status === 'running' ? null : new Date(startedAt.getTime() + (seed.durationMin ?? 3) * MINUTE);
  runSeq += 1;

  return {
    id: `RUN-${String(runSeq).padStart(6, '0')}`,
    status: seed.status,
    triggerType: seed.triggerType ?? 'scheduled',
    baseDate: toKstDate(new Date(startedAt.getTime() - (seed.baseDaysBefore ?? 0) * DAY)),
    startedAt: toKstDateTime(startedAt),
    endedAt: endedAt && toKstDateTime(endedAt),
    error:
      seed.error && endedAt
        ? { ...seed.error, occurredAt: toKstDateTime(new Date(endedAt.getTime() - 2 * 1000)) }
        : null,
  };
}

// 매개변수 타입(RunSeed[])이 있어야 'success' 같은 리터럴이 string으로 넓어지지 않는다
function runs(...seeds: RunSeed[]): Run[] {
  return seeds.map(makeRun);
}

const D = 24 * 60; // 하루(분)

/** 프로세스 ID → 실행 이력. 배열은 최신순으로 적는다 */
const runsByProcess: Record<string, Run[]> = {
  'PRC-001': runs(
    { startedMinAgo: 150, status: 'success', durationMin: 4 },
    { startedMinAgo: 150 + D, status: 'success', durationMin: 4 },
    { startedMinAgo: 150 + 2 * D, status: 'failed', durationMin: 2, error: { type: 'timeout', message: 'POS 매출 조회 화면 응답이 120초를 초과했습니다.' } },
  ),
  'PRC-002': runs(
    { startedMinAgo: 5, status: 'running' },
    { startedMinAgo: 65, status: 'success', durationMin: 2 },
    { startedMinAgo: 125, status: 'success', durationMin: 2 },
    { startedMinAgo: 185, status: 'failed', durationMin: 1, error: { type: 'system_error', message: 'WMS 연결이 끊어졌습니다. (ECONNRESET)' } },
    { startedMinAgo: 245, status: 'success', durationMin: 2 },
  ),
  'PRC-003': runs(
    { startedMinAgo: 90, status: 'failed', durationMin: 3, error: { type: 'element_not_found', message: "판매자센터 주문 목록에서 '신규 주문' 탭을 찾을 수 없습니다." } },
    { startedMinAgo: 90 + D, status: 'success', durationMin: 6 },
  ),
  'PRC-004': runs(
    { startedMinAgo: 3 * D, status: 'success', durationMin: 12, triggerType: 'manual', baseDaysBefore: 4 },
    { startedMinAgo: 4 * D, status: 'failed', durationMin: 5, error: { type: 'data_error', message: '거래처 3곳의 정산 금액이 비어 있어 정산서를 만들 수 없습니다.' } },
  ),
  'PRC-005': runs(
    { startedMinAgo: 40, status: 'failed', durationMin: 1, error: { type: 'login_failed', message: '카드사 사이트 로그인에 실패했습니다. (비밀번호 만료)' } },
    { startedMinAgo: 40 + D, status: 'success', durationMin: 3 },
  ),
  'PRC-006': runs(
    { startedMinAgo: 12 * 60, status: 'success', durationMin: 8 },
    { startedMinAgo: 12 * 60 + D, status: 'success', durationMin: 7 },
  ),
  'PRC-007': [],
  'PRC-008': runs(
    { startedMinAgo: 30, status: 'success', durationMin: 2, triggerType: 'manual' },
  ),
};

// ─── 조회 함수 (핸들러에서 사용) ─────────────────────
function toProcess(base: ProcessBase): Process {
  const latest = runsByProcess[base.id]?.at(0);
  return {
    id: base.id,
    name: base.name,
    department: base.department,
    triggerType: base.triggerType,
    lastStatus: latest?.status ?? null,
    lastRunAt: latest?.startedAt ?? null,
  };
}

export function getProcessList(): Process[] {
  return processBases.map(toProcess);
}

/** id에 해당하는 프로세스 상세. 없는 id면 undefined (핸들러가 404로 바꾼다) */
export function getProcessDetail(id: string): ProcessDetail | undefined {
  const base = processBases.find((item) => item.id === id);
  if (base === undefined) return undefined;

  // 목록 항목 필드 + 상세 전용 필드(description, schedule)
  return { ...toProcess(base), description: base.description, schedule: base.schedule };
}

/** id에 해당하는 프로세스의 실행 이력 (최신순 최대 20건, 명세 4번). 없는 id면 undefined */
export function getProcessRuns(id: string): Run[] | undefined {
  const base = processBases.find((item) => item.id === id);
  if (base === undefined) return undefined;

  // 프로세스는 있는데 이력 항목이 없으면 빈 배열 → undefined는 "프로세스 없음"에만 쓴다
  return (runsByProcess[id] ?? []).slice(0, 20);
}

/**
 * 수기 재실행 접수: "실행 중"인 새 이력을 맨 앞(최신)에 추가하고 돌려준다.
 * 이후 이 프로세스의 lastStatus가 running이 되므로, 다시 요청하면 409가 된다. 새로고침하면 초기화된다.
 */
export function addManualRun(id: string, baseDate: DateString): Run {
  runSeq += 1;
  const run: Run = {
    id: `RUN-${String(runSeq).padStart(6, '0')}`,
    status: 'running',
    triggerType: 'manual',
    baseDate,
    // 접수 시각은 워커가 시작된 시각(now)이 아니라 요청이 들어온 실제 시각
    startedAt: toKstDateTime(new Date()),
    endedAt: null,
    error: null,
  };
  // 기존 배열을 고치지 않고, 새 이력을 앞에 둔 새 배열로 바꾼다
  runsByProcess[id] = [run, ...(runsByProcess[id] ?? [])];
  return run;
}

export function getAllRuns(): Run[] {
  return Object.values(runsByProcess).flat();
}

/** 목 데이터 기준 현재 시각 */
export function getNow(): Date {
  return now;
}
