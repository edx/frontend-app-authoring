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
// A null result means the course has no analysis run yet -- polling keeps
// going in that case too (ACTIVE_STATUSES.has(undefined ?? 'PENDING')), so
// starting a run via useStartCourseAnalysisReport is picked up on the next
// tick without any manual query invalidation.
export function useCourseOptimizerReport(courseId: string) {
  return useQuery({
    queryKey: courseOptimizerReportQueryKeys.report(courseId),
    queryFn: () => fetchCourseAnalysisReportStatus(courseId),
    refetchInterval: (query) => (
      ACTIVE_STATUSES.has(query.state.data?.status ?? 'PENDING') ? 2000 : false
    ),
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
