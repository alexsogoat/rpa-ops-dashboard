import { http, HttpResponse } from 'msw';
import type { ApiError } from '../types/common';
import type { Process, ProcessDetail, Run } from '../types/process';
import { getAllRuns, getNow, getProcessDetail, getProcessList, toKstDate, getProcessRuns } from './data';
import type { Summary } from '../types/summary';

/** 404 PROCESS_NOT_FOUND 응답. 명세 "오류 응답" 형식({ code, message })을 따른다 */
function processNotFound(id: string) {
  return HttpResponse.json<ApiError>(
    { code: 'PROCESS_NOT_FOUND', message: `프로세스를 찾을 수 없습니다: ${id}` },
    { status: 404 },
  );
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
