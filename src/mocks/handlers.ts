import { http, HttpResponse } from 'msw';
import type { ApiError, DateString } from '../types/common';
import type { Process, ProcessDetail, RerunRequest, RerunResponse, Run } from '../types/process';
import {
  addManualRun,
  getAllRuns,
  getNow,
  getProcessDetail,
  getProcessList,
  getProcessRuns,
  toKstDate,
} from './data';
import type { Summary } from '../types/summary';

/** 404 PROCESS_NOT_FOUND 응답. 명세 "오류 응답" 형식({ code, message })을 따른다 */
function processNotFound(id: string) {
  return HttpResponse.json<ApiError>(
    { code: 'PROCESS_NOT_FOUND', message: `프로세스를 찾을 수 없습니다: ${id}` },
    { status: 404 },
  );
}

/** 400 INVALID_BASE_DATE 응답 */
function invalidBaseDate() {
  return HttpResponse.json<ApiError>(
    {
      code: 'INVALID_BASE_DATE',
      message: '기준일자는 오늘 또는 과거 날짜(YYYY-MM-DD)여야 합니다.',
    },
    { status: 400 },
  );
}

/** 409 PROCESS_ALREADY_RUNNING 응답 */
function processAlreadyRunning() {
  return HttpResponse.json<ApiError>(
    {
      code: 'PROCESS_ALREADY_RUNNING',
      message: '이미 실행 중인 프로세스입니다. 완료 후 다시 요청하세요.',
    },
    { status: 409 },
  );
}

/** 요청 본문에서 baseDate를 꺼낸다. 본문이 JSON이 아니거나 필드가 없으면 undefined */
async function readBaseDate(request: Request): Promise<unknown> {
  try {
    // 클라이언트가 보낸 값은 믿을 수 없다 → 반환 타입을 unknown으로 두고 isValidBaseDate에서 검사한다
    const body = (await request.json()) as Partial<RerunRequest> | null;
    return body?.baseDate;
  } catch {
    return undefined;
  }
}

/**
 * 기준일자 검사 (명세 5번). 통과하면 value를 DateString으로 쓸 수 있다.
 * `value is DateString`: 이 함수가 true를 돌려주면 호출한 쪽에서 value의 타입이 좁혀진다
 */
function isValidBaseDate(value: unknown, today: DateString): value is DateString {
  // 1) 누락이거나 문자열이 아님
  if (typeof value !== 'string') return false;

  // 2) YYYY-MM-DD 형식이 아님 (^ 시작, \d{4} 숫자 4자리, $ 끝)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  // 3) 없는 날짜 (예: 2026-02-30). Date로 바꿨다가 다시 문자열로 만들면 달라지거나 Invalid Date가 된다
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;

  // 4) 미래 날짜. YYYY-MM-DD 문자열은 글자 순서 비교가 날짜 순서와 같다
  if (value > today) return false;

  return true;
}

export const handlers = [
  // GET /api/processes — 프로세스 목록
  http.get('/api/processes', () => {
    return HttpResponse.json<Process[]>(getProcessList());
  }),

  // GET /api/processes/:id — 프로세스 상세
  // 제네릭 { id: string }: 경로의 :id 자리 값을 params.id(string)로 꺼낸다
  http.get<{ id: string }>('/api/processes/:id', ({ params }) => {
    const detail = getProcessDetail(params.id);

    if (detail === undefined) {
      return processNotFound(params.id);
    }

    return HttpResponse.json<ProcessDetail>(detail);
  }),

  // GET /api/processes/:id/runs — 실행 이력 (최근 20건)
  http.get<{ id: string }>('/api/processes/:id/runs', ({ params }) => {
    const runs = getProcessRuns(params.id);

    if (runs === undefined) {
      return processNotFound(params.id);
    }

    // 위 if를 통과했으므로 runs는 Run[]로 좁혀져 있다 (함수를 다시 부르면 좁혀지지 않은 새 값이 된다)
    return HttpResponse.json<Run[]>(runs);
  }),

  // POST /api/processes/:id/runs — 수기 재실행 요청 (명세 5번)
  // 본문을 읽는 request.json()이 Promise라서 함수에 async를 붙이고 await로 기다린다
  http.post<{ id: string }>('/api/processes/:id/runs', async ({ params, request }) => {
    // 검사 순서는 명세대로 404 → 400 → 409
    const detail = getProcessDetail(params.id);
    if (detail === undefined) {
      return processNotFound(params.id);
    }

    const baseDate = await readBaseDate(request);
    if (!isValidBaseDate(baseDate, toKstDate(new Date()))) {
      return invalidBaseDate();
    }

    // 이미 실행 중인 프로세스면 409 (명세: lastStatus가 "running")
    if (detail.lastStatus === 'running') {
      return processAlreadyRunning();
    }

    // 여기서 baseDate는 DateString으로 좁혀져 있다
    const run = addManualRun(params.id, baseDate);

    // 202 Accepted: 접수만 하고 실행 완료를 기다리지 않는다
    return HttpResponse.json<RerunResponse>(
      { runId: run.id, baseDate: run.baseDate, acceptedAt: run.startedAt },
      { status: 202 },
    );
  }),

  // GET /api/summary — 오늘 요약
  http.get('/api/summary', () => {
    const today = toKstDate(getNow());
    // startedAt 앞 10글자("2026-09-24")가 KST 날짜
    const todayRuns = getAllRuns().filter((run) => run.startedAt.slice(0, 10) === today);

    const successCount = todayRuns.filter((run) => run.status === 'success').length;
    const errorCount = todayRuns.filter((run) => run.status === 'failed').length;
    // 성공률 분모는 완료 건(success + failed)만. running은 아직 결과가 없으므로 제외
    const completedCount = successCount + errorCount;

    return HttpResponse.json<Summary>({
      date: today,
      totalRuns: todayRuns.length,
      successRate:
        completedCount === 0 ? null : Math.round((successCount / completedCount) * 1000) / 10,
      errorCount,
    });
  }),
];
