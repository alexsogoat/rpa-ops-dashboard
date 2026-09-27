import { http, HttpResponse } from 'msw';
import type { Process } from '../types/process';
import { getAllRuns, getNow, getProcessList, toKstDate } from './data';
import type { Summary } from '../types/summary';

export const handlers = [
  // GET /api/processes — 프로세스 목록
  http.get('/api/processes', () => {
    return HttpResponse.json<Process[]>(getProcessList());
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
