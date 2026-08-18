import {
  fireEvent, initializeMocks, render, screen, within,
} from '@src/testUtils';
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

    // Summary stat tiles (SummaryBar).
    expect(screen.getByText('Estimated learning time on platform')).toBeInTheDocument();
    expect(screen.getByText('Findings')).toBeInTheDocument();
    expect(screen.getByText('By severity')).toBeInTheDocument();
    expect(screen.getByText('By category')).toBeInTheDocument();

    // Timeline legend now explains the flagged-section marker.
    expect(screen.getByText('Flagged')).toBeInTheDocument();

    // The full-course view is dense enough that it doesn't show a findings
    // badge strip at all -- only the by-section view does (see below).
    expect(screen.queryByTitle('1 finding')).not.toBeInTheDocument();
  });

  it('shows a findings-count badge below the track only in the by-section timeline view', () => {
    const run: CourseAnalysisRun = {
      runId: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    };
    render(<CourseOptimizerReportBody run={run} isError={false} startAnalysisError={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'By Section' }));

    // The badge is a sibling below the track, not layered on the tile itself.
    const tile = screen.getByRole('button', { name: /Welcome Video/ });
    expect(tile).toHaveTextContent('');
    const moduleRow = tile.closest('.module-timeline__row') as HTMLElement;
    // This section has two single-finding components (Welcome Video and the
    // Environment Check Quiz), so two "1 finding" badges are expected here.
    const badges = within(moduleRow).getAllByTitle('1 finding');
    expect(badges).toHaveLength(2);
    badges.forEach((badge) => expect(badge).toHaveTextContent('1'));
  });

  it('sorts the findings table by severity when the column header is clicked', () => {
    const run: CourseAnalysisRun = {
      runId: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    };
    render(<CourseOptimizerReportBody run={run} isError={false} startAnalysisError={false} />);

    const severityHeader = screen.getByRole('columnheader', { name: /Severity/ });
    fireEvent.click(severityHeader);

    const rows = screen.getAllByRole('row').slice(1); // drop the header row
    expect(within(rows[0]).getByText('Critical')).toBeInTheDocument();
  });

  it('dims other sections in the full-course timeline when one is highlighted', () => {
    const run: CourseAnalysisRun = {
      runId: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    };
    render(<CourseOptimizerReportBody run={run} isError={false} startAnalysisError={false} />);

    const introLabel = screen.getByRole('button', { name: /Introduction to Data Science/ });
    fireEvent.click(introLabel);

    const otherSectionTile = screen.getByRole('button', { name: /Measures of Central Tendency/ });
    expect(otherSectionTile.className).toContain('timeline-tile--dimmed');

    fireEvent.click(introLabel);
    expect(otherSectionTile.className).not.toContain('timeline-tile--dimmed');
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
