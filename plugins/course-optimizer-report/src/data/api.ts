import type { CourseReport } from '../types/courseReport';
import { courseReportFixture } from './courseReportFixture';

const FIXTURE = courseReportFixture;

// Per-courseId poll-tick counters, so each course's mock run progresses
// independently and repeated polls advance rather than repeating tick 0.
const tickByCourseId = new Map<string, number>();

// 5a (this repo's current phase): simulates the pipeline's PENDING ->
// RUNNING -> PARTIAL -> COMPLETE progression over a handful of poll ticks,
// against the real course_report.fixture.json copied from the
// course-optimizer prototype's contracts/ directory. This is what lets the
// whole widget be built and demoed in devstack with zero dependency on
// xpert-api-services or a Studio-brokered token.
//
// 5b (deferred): replace this function's body with a real fetch — a
// separate Bearer-auth client against xpert-api-services using a
// Studio-brokered token — once that endpoint and xpert-api-services' JWT
// validation middleware exist. useCourseOptimizerReport's signature and the
// component tree that consumes it do not need to change when that happens.
export async function fetchCourseOptimizerReportMock(courseId: string): Promise<CourseReport> {
  const tick = tickByCourseId.get(courseId) ?? 0;
  tickByCourseId.set(courseId, tick + 1);

  if (tick === 0) {
    return {
      ...FIXTURE,
      status: 'PENDING',
      findings: [],
    };
  }
  if (tick === 1) {
    return {
      ...FIXTURE,
      status: 'RUNNING',
      findings: [],
    };
  }
  if (tick === 2) {
    // A PARTIAL snapshot: some findings have landed, summaries not yet final.
    return {
      ...FIXTURE,
      status: 'PARTIAL',
      findings: FIXTURE.findings.slice(0, 2),
    };
  }
  return FIXTURE;
}

// Resets a course's mock poll progression — used by tests that need a fresh
// PENDING -> ... sequence rather than continuing from another test's ticks.
export function resetCourseOptimizerReportMock(courseId: string): void {
  tickByCourseId.delete(courseId);
}
