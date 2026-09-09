import {
  fireEvent, initializeMocks, render, screen, waitFor,
} from '@src/testUtils';
import { courseReportFixture } from './extended/data/courseReportFixture';
import { getCourseAnalysisReportStatusApiUrl, postCourseAnalysisReportApiUrl } from './extended/data/api';
import CourseOptimizerExtendedPage from './CourseOptimizerExtendedPage';

jest.mock('../generic/model-store', () => ({
  useModel: jest.fn().mockReturnValue({ name: 'About Node JS' }),
}));

jest.setTimeout(15000);

describe('CourseOptimizerExtendedPage', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';
  let axiosMock: ReturnType<typeof initializeMocks>['axiosMock'];
  let statusUrl: string;

  beforeEach(() => {
    ({ axiosMock } = initializeMocks());
    statusUrl = getCourseAnalysisReportStatusApiUrl(courseId);
  });

  it('always shows the persistent header, even before the report resolves', () => {
    axiosMock.onGet(statusUrl).reply(404);
    render(<CourseOptimizerExtendedPage courseId={courseId} />);

    expect(screen.getByRole('heading', { name: 'Course Optimizer' })).toBeInTheDocument();
    expect(screen.getByText(/This tool uses AI to scan your course/)).toBeInTheDocument();
  });

  it('shows a Start analysis button in the header when the course has no run yet', async () => {
    axiosMock.onGet(statusUrl).reply(404);
    render(<CourseOptimizerExtendedPage courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start analysis' })).toBeInTheDocument();
    });
  });

  it('shows a Re-run analysis button in the header once a run exists', async () => {
    axiosMock.onGet(statusUrl).reply(200, {
      run_id: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    });
    render(<CourseOptimizerExtendedPage courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Re-run analysis' })).toBeInTheDocument();
    });
  });

  it('kicks off a new run when the header button is clicked', async () => {
    axiosMock.onGet(statusUrl).reply(404);
    const startUrl = postCourseAnalysisReportApiUrl(courseId);
    axiosMock.onPost(startUrl).reply(202, { run_id: 'run-123' });

    render(<CourseOptimizerExtendedPage courseId={courseId} />);

    const button = await screen.findByRole('button', { name: 'Start analysis' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axiosMock.history.post).toHaveLength(1);
    });
    expect(axiosMock.history.post[0].url).toEqual(startUrl);
  });

  it('renders the report body once the pipeline completes', async () => {
    axiosMock.onGet(statusUrl).reply(200, {
      run_id: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    });

    render(<CourseOptimizerExtendedPage courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByText(/Findings \(5\)/)).toBeInTheDocument();
    });
  });
});
