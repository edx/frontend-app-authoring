import {
  initializeMocks, render, screen, waitFor,
} from '@src/testUtils';
import { fetchCourseOptimizerReportMock, resetCourseOptimizerReportMock } from './data/api';
import CourseOptimizerReportWidget from './CourseOptimizerReportWidget';

jest.setTimeout(15000);

describe('CourseOptimizerReportWidget', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';

  beforeEach(() => {
    initializeMocks();
    resetCourseOptimizerReportMock(courseId);
  });

  it('renders nothing while the report has not resolved yet', () => {
    render(<CourseOptimizerReportWidget courseId={courseId} />);
    // First render, before the query resolves: no report to show yet.
    expect(screen.queryByText('Foundations of Data Science')).not.toBeInTheDocument();
  });

  it('renders the course title, summary, and findings once the pipeline completes', async () => {
    // Advance the mock past PENDING/RUNNING/PARTIAL so the widget's own
    // first fetch resolves directly to COMPLETE.
    await fetchCourseOptimizerReportMock(courseId);
    await fetchCourseOptimizerReportMock(courseId);
    await fetchCourseOptimizerReportMock(courseId);

    render(<CourseOptimizerReportWidget courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByText('Foundations of Data Science')).toBeInTheDocument();
    });
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText(/Findings \(5\)/)).toBeInTheDocument();
  });

  it('renders a PARTIAL snapshot with only some findings populated', async () => {
    await fetchCourseOptimizerReportMock(courseId); // PENDING
    await fetchCourseOptimizerReportMock(courseId); // RUNNING

    render(<CourseOptimizerReportWidget courseId={courseId} />);

    await waitFor(() => {
      expect(screen.getByText('Partial')).toBeInTheDocument();
    });
    expect(screen.getByText(/Findings \(2\)/)).toBeInTheDocument();
  });
});
