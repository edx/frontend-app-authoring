import { initializeMocks, render, screen } from '@src/testUtils';
import { courseReportFixture } from './data/courseReportFixture';
import CourseOptimizerReportBody from './CourseOptimizerReportBody';
import type { CourseAnalysisRun } from './types/courseReport';

describe('CourseOptimizerReportBody', () => {
  beforeEach(() => {
    initializeMocks();
  });

  it('renders nothing while the report has not resolved yet', () => {
    render(<CourseOptimizerReportBody run={undefined} isError={false} startAnalysisError={false} />);
    expect(screen.queryByText(/Findings/)).not.toBeInTheDocument();
  });

  it('shows an error alert when the report failed to load', () => {
    render(<CourseOptimizerReportBody run={undefined} isError startAnalysisError={false} />);
    expect(screen.getByText('The Course Optimizer report could not be loaded.')).toBeInTheDocument();
  });

  it('prompts to start analysis when the course has no run yet', () => {
    render(<CourseOptimizerReportBody run={null} isError={false} startAnalysisError={false} />);
    expect(screen.getByText(/Run a deeper analysis/)).toBeInTheDocument();
  });

  it('shows the start-analysis error alert alongside the not-started body', () => {
    render(<CourseOptimizerReportBody run={null} isError={false} startAnalysisError />);
    expect(screen.getByText('Could not start the analysis run. Please try again.')).toBeInTheDocument();
  });

  it('shows a pending state once a run has started but has no report yet', () => {
    const run: CourseAnalysisRun = {
      runId: 'run-123', status: 'RUNNING', report: null, error: null,
    };
    render(<CourseOptimizerReportBody run={run} isError={false} startAnalysisError={false} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('shows the run error when a run fails before any report snapshot', () => {
    const run: CourseAnalysisRun = {
      runId: 'run-123', status: 'FAILED', report: null, error: 'boom',
    };
    render(<CourseOptimizerReportBody run={run} isError={false} startAnalysisError={false} />);
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('renders the summary and findings once the pipeline completes', () => {
    const run: CourseAnalysisRun = {
      runId: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    };
    render(<CourseOptimizerReportBody run={run} isError={false} startAnalysisError={false} />);

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText(/Findings \(5\)/)).toBeInTheDocument();
  });

  it('renders a PARTIAL snapshot with only some findings populated', () => {
    const partialFixture = {
      ...courseReportFixture, status: 'PARTIAL' as const, findings: courseReportFixture.findings.slice(0, 2),
    };
    const run: CourseAnalysisRun = {
      runId: 'run-123', status: 'PARTIAL', report: partialFixture, error: null,
    };
    render(<CourseOptimizerReportBody run={run} isError={false} startAnalysisError={false} />);

    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText(/Findings \(2\)/)).toBeInTheDocument();
  });
});
