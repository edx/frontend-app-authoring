import {
  fireEvent, initializeMocks, render, screen, waitFor,
} from '@src/testUtils';
import { courseReportFixture } from './data/courseReportFixture';
import { getCourseAnalysisReportStatusApiUrl, postCourseAnalysisReportApiUrl } from './data/api';
import CourseOptimizerReportWidget from './CourseOptimizerReportWidget';

jest.setTimeout(15000);

describe('CourseOptimizerReportWidget', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';
  let axiosMock: ReturnType<typeof initializeMocks>['axiosMock'];
  let statusUrl: string;

  beforeEach(() => {
    ({ axiosMock } = initializeMocks());
    statusUrl = getCourseAnalysisReportStatusApiUrl(courseId);
  });

  it('renders nothing while the report has not resolved yet', () => {
    axiosMock.onGet(statusUrl).reply(404);
    render(<CourseOptimizerReportWidget courseId={courseId} />);
    // First render, before the query resolves: no report to show yet.
    expect(screen.queryByText('Foundations of Data Science')).not.toBeInTheDocument();
  });

  it('offers to start analysis when the course has no run yet', async () => {
    axiosMock.onGet(statusUrl).reply(404);
    render(<CourseOptimizerReportWidget courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start analysis' })).toBeInTheDocument();
    });
  });

  it('shows a pending state once a run has started but has no report yet', async () => {
    axiosMock.onGet(statusUrl).reply(200, {
      run_id: 'run-123', status: 'RUNNING', report: null, error: null,
    });
    render(<CourseOptimizerReportWidget courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Start analysis' })).not.toBeInTheDocument();
  });

  it('renders the course title, summary, and findings once the pipeline completes', async () => {
    axiosMock.onGet(statusUrl).reply(200, {
      run_id: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    });

    render(<CourseOptimizerReportWidget courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByText('Foundations of Data Science')).toBeInTheDocument();
    });
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText(/Findings \(5\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Re-run analysis' })).toBeInTheDocument();
  });

  it('renders a PARTIAL snapshot with only some findings populated', async () => {
    const partialFixture = { ...courseReportFixture, status: 'PARTIAL' as const, findings: courseReportFixture.findings.slice(0, 2) };
    axiosMock.onGet(statusUrl).reply(200, {
      run_id: 'run-123', status: 'PARTIAL', report: partialFixture, error: null,
    });

    render(<CourseOptimizerReportWidget courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByText('Partial')).toBeInTheDocument();
    });
    expect(screen.getByText(/Findings \(2\)/)).toBeInTheDocument();
  });

  it('kicks off a new run when Start analysis is clicked', async () => {
    axiosMock.onGet(statusUrl).reply(404);
    const startUrl = postCourseAnalysisReportApiUrl(courseId);
    axiosMock.onPost(startUrl).reply(202, { run_id: 'run-123' });

    render(<CourseOptimizerReportWidget courseId={courseId} />);

    const button = await screen.findByRole('button', { name: 'Start analysis' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axiosMock.history.post).toHaveLength(1);
    });
    expect(axiosMock.history.post[0].url).toEqual(startUrl);
  });
});
