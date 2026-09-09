import { initializeMocks } from '@src/testUtils';
import { courseReportFixture } from './courseReportFixture';
import {
  fetchCourseAnalysisReportStatus,
  getCourseAnalysisReportStatusApiUrl,
  postCourseAnalysisReport,
  postCourseAnalysisReportApiUrl,
} from './api';

describe('postCourseAnalysisReport', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';

  it('posts to the Studio proxy endpoint to queue a run', async () => {
    const { axiosMock } = initializeMocks();
    const url = postCourseAnalysisReportApiUrl(courseId);
    axiosMock.onPost(url).reply(202, { status: 'pending' });

    await postCourseAnalysisReport(courseId);

    expect(axiosMock.history.post[0].url).toEqual(url);
  });
});

describe('fetchCourseAnalysisReportStatus', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';

  it('fetches the run status and normalizes the response', async () => {
    const { axiosMock } = initializeMocks();
    const url = getCourseAnalysisReportStatusApiUrl(courseId);
    axiosMock.onGet(url).reply(200, {
      run_id: 'run-123',
      status: 'COMPLETE',
      report: courseReportFixture,
      error: null,
    });

    const result = await fetchCourseAnalysisReportStatus(courseId);

    expect(result).toEqual({
      runId: 'run-123',
      status: 'COMPLETE',
      report: courseReportFixture,
      error: null,
    });
  });

  it('returns null when the course has no runs yet', async () => {
    const { axiosMock } = initializeMocks();
    const url = getCourseAnalysisReportStatusApiUrl(courseId);
    axiosMock.onGet(url).reply(404, { detail: 'No runs found for course' });

    const result = await fetchCourseAnalysisReportStatus(courseId);

    expect(result).toBeNull();
  });

  it('rethrows non-404 errors', async () => {
    const { axiosMock } = initializeMocks();
    const url = getCourseAnalysisReportStatusApiUrl(courseId);
    axiosMock.onGet(url).reply(502);

    await expect(fetchCourseAnalysisReportStatus(courseId)).rejects.toBeTruthy();
  });
});
