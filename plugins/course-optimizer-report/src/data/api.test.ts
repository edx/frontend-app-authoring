import { fetchCourseOptimizerReportMock, resetCourseOptimizerReportMock } from './api';

describe('fetchCourseOptimizerReportMock', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';

  beforeEach(() => {
    resetCourseOptimizerReportMock(courseId);
  });

  it('progresses PENDING -> RUNNING -> PARTIAL -> COMPLETE across successive calls', async () => {
    const pending = await fetchCourseOptimizerReportMock(courseId);
    expect(pending.status).toBe('PENDING');
    expect(pending.findings).toEqual([]);

    const running = await fetchCourseOptimizerReportMock(courseId);
    expect(running.status).toBe('RUNNING');
    expect(running.findings).toEqual([]);

    const partial = await fetchCourseOptimizerReportMock(courseId);
    expect(partial.status).toBe('PARTIAL');
    expect(partial.findings).toHaveLength(2);

    const complete = await fetchCourseOptimizerReportMock(courseId);
    expect(complete.status).toBe('COMPLETE');
    expect(complete.findings.length).toBeGreaterThan(2);

    // Stays COMPLETE on further polls, matching a real terminal pipeline status.
    const stillComplete = await fetchCourseOptimizerReportMock(courseId);
    expect(stillComplete.status).toBe('COMPLETE');
  });

  it('tracks each courseId independently', async () => {
    const otherCourseId = 'course-v1:Other+Course+Run';
    await fetchCourseOptimizerReportMock(courseId);
    await fetchCourseOptimizerReportMock(courseId);

    const otherReport = await fetchCourseOptimizerReportMock(otherCourseId);
    expect(otherReport.status).toBe('PENDING');
  });
});
