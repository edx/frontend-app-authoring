import {
  Alert, Badge, Button, Card,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseOptimizerReport, useStartCourseAnalysisReport } from './data/apiHooks';
import { CourseReportProvider } from './context/CourseReportContext';
import { ReportUiProvider } from './context/ReportUiContext';
import messages from './messages';
import { SummaryBar } from './components/SummaryBar';
import { ContentTimeline } from './components/ContentTimeline';
import { FindingsPanel } from './components/FindingsPanel';
import { ExportFindingsButton } from './components/ExportFindingsButton';
import type { PipelineStatus } from './types/courseReport';
import './CourseOptimizerReportWidget.scss';

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
  courseId: string;
}

// Registered as the RenderWidget for
// org.openedx.frontend.authoring.course_optimizer_extended_report.v1.
// Owns its own data-fetching and UI state via the Provider components below,
// decoupling its lifecycle from the host CourseOptimizerPage — only courseId
// flows in as a prop.
const CourseOptimizerReportWidget = ({ courseId }: Props) => {
  const intl = useIntl();
  const { data: run, isError } = useCourseOptimizerReport(courseId);
  const startAnalysis = useStartCourseAnalysisReport(courseId);

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

  const startButton = (
    <Button
      variant="primary"
      size="sm"
      onClick={() => startAnalysis.mutate()}
      disabled={startAnalysis.isPending}
    >
      {intl.formatMessage(run ? messages.rerunAnalysisButton : messages.startAnalysisButton)}
    </Button>
  );

  if (!run) {
    return (
      <Card className="course-optimizer-report-card mt-3">
        <Card.Header title={intl.formatMessage(messages.notStartedHeading)} />
        <Card.Section>
          <p>{intl.formatMessage(messages.notStartedBody)}</p>
          {startAnalysis.isError && (
            <Alert variant="danger">{intl.formatMessage(messages.startAnalysisError)}</Alert>
          )}
          {startButton}
        </Card.Section>
      </Card>
    );
  }

  if (!run.report) {
    // A run exists but hasn't reached its first report snapshot yet.
    const failed = run.status === 'FAILED';
    return (
      <Card className="course-optimizer-report-card mt-3">
        <Card.Header
          title={intl.formatMessage(messages.notStartedHeading)}
          actions={(
            <Badge variant={STATUS_BADGE_VARIANT[run.status]}>
              {intl.formatMessage(messages[STATUS_MESSAGE[run.status]])}
            </Badge>
          )}
        />
        <Card.Section>
          {failed ? (
            <>
              <Alert variant="danger">{run.error ?? intl.formatMessage(messages.startAnalysisError)}</Alert>
              {startButton}
            </>
          ) : (
            <p>{intl.formatMessage(messages.reportPendingBody)}</p>
          )}
        </Card.Section>
      </Card>
    );
  }

  const { report } = run;

  return (
    <CourseReportProvider value={report}>
      <ReportUiProvider>
        <Card className="course-optimizer-report-card mt-3">
          <Card.Header
            title={report.course.display_name}
            actions={(
              <div className="course-optimizer-report-widget__header-actions">
                <Badge variant={STATUS_BADGE_VARIANT[report.status]}>
                  {intl.formatMessage(messages[STATUS_MESSAGE[report.status]])}
                </Badge>
                {startButton}
              </div>
            )}
          />
          <Card.Section>
            <SummaryBar />
            <ContentTimeline />
            <div className="course-optimizer-report-widget__export-row">
              <ExportFindingsButton />
            </div>
            <FindingsPanel />
          </Card.Section>
        </Card>
      </ReportUiProvider>
    </CourseReportProvider>
  );
};

export default CourseOptimizerReportWidget;
