import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';
import type { CourseAnalysisRun } from '../types/courseReport';

export const postCourseAnalysisReportApiUrl = (courseId: string): string => (
  new URL(`api/contentstore/v0/course_analysis_report/${courseId}`, getConfig().STUDIO_BASE_URL).href
);

export const getCourseAnalysisReportStatusApiUrl = (courseId: string): string => (
  new URL(`api/contentstore/v0/course_analysis_report_status/${courseId}`, getConfig().STUDIO_BASE_URL).href
);

// Kicks off a new Course Optimizer extended-analysis run. Studio generates
// the course export server-side and hands it to xpert-ai-workflows, so this
// is a plain Studio API call (getAuthenticatedHttpClient), same as every
// other Studio-backed hook in this repo.
export async function postCourseAnalysisReport(courseId: string): Promise<{ runId: string }> {
  const { data } = await getAuthenticatedHttpClient()
    .post(postCourseAnalysisReportApiUrl(courseId));
  return { runId: data.run_id };
}

// Fetches the course's most recent Course Optimizer extended-analysis run.
// Null means the course has no runs yet -- Studio proxies a 404 from
// xpert-ai-workflows in that case, which callers should treat as "not
// started" rather than an error.
export async function fetchCourseAnalysisReportStatus(courseId: string): Promise<CourseAnalysisRun | null> {
  try {
    const { data } = await getAuthenticatedHttpClient()
      .get(getCourseAnalysisReportStatusApiUrl(courseId));
    return {
      runId: data.run_id,
      status: data.status,
      report: data.report,
      error: data.error,
    };
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}
