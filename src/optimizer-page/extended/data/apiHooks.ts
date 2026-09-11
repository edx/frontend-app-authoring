import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCourseAnalysisReportStatus, postCourseAnalysisReport } from './api';

export const courseOptimizerReportQueryKeys = {
  all: ['course-optimizer-report'] as const,
  report: (courseId: string) => [...courseOptimizerReportQueryKeys.all, courseId] as const,
};

const ACTIVE_STATUSES = new Set(['PENDING', 'RUNNING', 'PARTIAL']);

// Standalone React Query hook (decision: no Redux) — this section's fetch/poll
// cycle is fully decoupled from CourseOptimizerPage.tsx's existing Redux-based
// polling for the legacy link-check scan; the two share no state.
//
// Only polls while a run is actively in progress, or `awaitingRun` is true.
// A null result normally stops polling rather than repeatedly re-checking
// status for a run that was never started -- but the POST that starts a run
// only queues a background export/upload task (see postCourseAnalysisReport),
// so a null result can still show up briefly right after starting one, before
// it's reached xpert-ai-workflows. `awaitingRun` (true from a successful
// start until a real run appears) bridges that gap without reintroducing
// polling for a course that was simply never scanned.
export function useCourseOptimizerReport(courseId: string, awaitingRun: boolean) {
  return useQuery({
    queryKey: courseOptimizerReportQueryKeys.report(courseId),
    queryFn: () => fetchCourseAnalysisReportStatus(courseId),
    refetchInterval: (query) => {
      const { status } = query.state.data ?? {};
      if (status && ACTIVE_STATUSES.has(status)) { return 2000; }
      return awaitingRun && query.state.data === null ? 2000 : false;
    },
  });
}

// Kicks off a new Course Optimizer extended-analysis run for a course.
export function useStartCourseAnalysisReport(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postCourseAnalysisReport(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseOptimizerReportQueryKeys.report(courseId) });
    },
  });
}
