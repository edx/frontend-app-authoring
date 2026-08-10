import { Alert, Badge, Card } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseOptimizerReport } from './data/apiHooks';
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
  const { data: report, isError } = useCourseOptimizerReport(courseId);

  if (isError) {
    return (
      <Alert variant="danger" className="mt-3">
        {intl.formatMessage(messages.reportErrorHeading)}
      </Alert>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <CourseReportProvider value={report}>
      <ReportUiProvider>
        <Card className="course-optimizer-report-card mt-3">
          <Card.Header
            title={report.course.display_name}
            actions={(
              <Badge variant={STATUS_BADGE_VARIANT[report.status]}>
                {intl.formatMessage(messages[STATUS_MESSAGE[report.status]])}
              </Badge>
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
