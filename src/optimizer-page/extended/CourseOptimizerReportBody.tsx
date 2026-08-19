import {
  Alert, Badge,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { CourseReportProvider } from './context/CourseReportContext';
import { ReportUiProvider } from './context/ReportUiContext';
import messages from './messages';
import { SummaryBar } from './components/SummaryBar';
import { ContentTimeline } from './components/ContentTimeline';
import { FindingsPanel } from './components/FindingsPanel';
import { ExportFindingsButton } from './components/ExportFindingsButton';
import type { CourseAnalysisRun, PipelineStatus } from './types/courseReport';
import './CourseOptimizerReportBody.scss';

const STATUS_MESSAGE: Record<PipelineStatus, keyof typeof messages> = {
  PENDING: 'reportStatusPending',
  RUNNING: 'reportStatusRunning',
  PARTIAL: 'reportStatusPartial',
  COMPLETE: 'reportStatusComplete',
  FAILED: 'reportStatusFailed',
};

const STATUS_BADGE_VARIANT: Record<PipelineStatus, string> = {
  PENDING: 'light',
  RUNNING: 'info',
  PARTIAL: 'warning',
  COMPLETE: 'success',
  FAILED: 'danger',
};

interface Props {
  run: CourseAnalysisRun | null | undefined;
  isError: boolean;
  // The start/re-run button lives in the page header, not here.
  startAnalysisError: boolean;
}

// Renders beneath the page's persistent header: not-started/pending/failed
// states, then the full report once one is available.
const CourseOptimizerReportBody = ({ run, isError, startAnalysisError }: Props) => {
  const intl = useIntl();

  if (isError) {
    return (
      <Alert variant="danger" className="mt-3">
        {intl.formatMessage(messages.reportErrorHeading)}
      </Alert>
    );
  }

  // Still resolving the first fetch -- run is undefined until then, and null
  // afterwards only means "no run exists yet" (a real, renderable state).
  if (run === undefined) {
    return null;
  }

  if (!run) {
    return (
      <div className="course-optimizer-report-body px-3 py-1">
        <p>{intl.formatMessage(messages.notStartedBody)}</p>
        {startAnalysisError && (
          <Alert variant="danger">{intl.formatMessage(messages.startAnalysisError)}</Alert>
        )}
      </div>
    );
  }

  if (!run.report) {
    // A run exists but hasn't reached its first report snapshot yet.
    const failed = run.status === 'FAILED';
    return (
      <div className="course-optimizer-report-body px-3 py-1">
        <Badge variant={STATUS_BADGE_VARIANT[run.status]} className="mb-2">
          {intl.formatMessage(messages[STATUS_MESSAGE[run.status]])}
        </Badge>
        {failed ? (
          <Alert variant="danger">{run.error ?? intl.formatMessage(messages.startAnalysisError)}</Alert>
        ) : (
          <p>{intl.formatMessage(messages.reportPendingBody)}</p>
        )}
      </div>
    );
  }

  const { report } = run;

  return (
    <CourseReportProvider value={report}>
      <ReportUiProvider>
        <div className="course-optimizer-report-body px-3 py-1">
          <div className="course-optimizer-report-body__status-row">
            <Badge variant={STATUS_BADGE_VARIANT[report.status]}>
              {intl.formatMessage(messages[STATUS_MESSAGE[report.status]])}
            </Badge>
            <span>
              {intl.formatMessage(messages.reportLastGeneratedOn)}
              {' '}
              {intl.formatDate(report.generated_at, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <SummaryBar />
          <ContentTimeline />
          <div className="course-optimizer-report-body__export-row">
            <ExportFindingsButton />
          </div>
          <FindingsPanel />
        </div>
      </ReportUiProvider>
    </CourseReportProvider>
  );
};

export default CourseOptimizerReportBody;
