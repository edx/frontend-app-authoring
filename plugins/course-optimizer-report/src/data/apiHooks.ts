import { useQuery } from '@tanstack/react-query';
import { fetchCourseOptimizerReportMock } from './api';

export const courseOptimizerReportQueryKeys = {
  all: ['course-optimizer-report'] as const,
  report: (courseId: string) => [...courseOptimizerReportQueryKeys.all, courseId] as const,
};

const ACTIVE_STATUSES = new Set(['PENDING', 'RUNNING', 'PARTIAL']);

// Standalone React Query hook (decision: no Redux) — this section's fetch/poll
// cycle is fully decoupled from CourseOptimizerPage.tsx's existing Redux-based
// polling for the legacy link-check scan; the two share no state.
//
// Currently backed by fetchCourseOptimizerReportMock (5a) so the widget can be
// built/demoed without xpert-api-services or a Studio-brokered token. Landing
// 5b means swapping only this queryFn for a real authenticated fetch — this
// hook's signature and every component that consumes it stay the same.
export function useCourseOptimizerReport(courseId: string) {
  return useQuery({
    queryKey: courseOptimizerReportQueryKeys.report(courseId),
    queryFn: () => fetchCourseOptimizerReportMock(courseId),
    refetchInterval: (query) => (
      ACTIVE_STATUSES.has(query.state.data?.status ?? 'PENDING') ? 2000 : false
    ),
  });
}
