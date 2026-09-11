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
// Only polls while a run is actively in progress. A null result (no run
// exists yet) stops polling rather than repeatedly re-checking status for a
// run that was never started. Studio (edx-platform#466/ea9a0d03c6) marks a
// just-started run PENDING in its own cache synchronously before the start
// POST returns, so this never sees a false null right after starting one --
// useStartCourseAnalysisReport's invalidateQueries picks that up immediately.
export function useCourseOptimizerReport(courseId: string) {
  return useQuery({
    queryKey: courseOptimizerReportQueryKeys.report(courseId),
    queryFn: () => fetchCourseAnalysisReportStatus(courseId),
    refetchInterval: (query) => {
      const { status } = query.state.data ?? {};
      return status && ACTIVE_STATUSES.has(status) ? 2000 : false;
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
