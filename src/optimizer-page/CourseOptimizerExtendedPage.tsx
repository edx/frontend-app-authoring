import { FC } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Badge, Card, Container, Icon, StatefulButton,
} from '@openedx/paragon';
import { SpinnerSimple } from '@openedx/paragon/icons';
import { Helmet } from 'react-helmet';

import { useModel } from '../generic/model-store';
import { STATEFUL_BUTTON_STATES } from '../constants';
import CourseOptimizerReportBody, { useCourseOptimizerReport, useStartCourseAnalysisReport } from './extended';
import messages from './extended/messages';
import './CourseOptimizerExtendedPage.scss';

const CourseOptimizerExtendedPage: FC<{ courseId: string }> = ({ courseId }) => {
  const intl = useIntl();
  const courseDetails = useModel('courseDetails', courseId);
  const { data: run, isError } = useCourseOptimizerReport(courseId);
  const startAnalysis = useStartCourseAnalysisReport(courseId);

  const scanButtonState = startAnalysis.isPending
    ? STATEFUL_BUTTON_STATES.pending
    : STATEFUL_BUTTON_STATES.default;

  return (
    <>
      <Helmet>
        <title>
          {intl.formatMessage(messages.pageTitle, {
            headingTitle: intl.formatMessage(messages.pageHeading),
            courseName: courseDetails?.name,
            siteName: process.env.SITE_NAME,
          })}
        </title>
      </Helmet>
      <Container size="xl" className="mt-4 px-4 export">
        <section className="setting-items mb-4">
          <article>
            <div className="course-optimizer-page__header-row d-flex flex-wrap justify-content-between align-items-end mb-3 p-3">
              <div>
                <p className="small text-muted mb-1">{intl.formatMessage(messages.pageEyebrow)}</p>
                <div className="d-flex align-items-center">
                  <h1 className="h2 mb-0 mr-3">{intl.formatMessage(messages.pageHeading)}</h1>
                  <Badge variant="primary" className="ml-2">{intl.formatMessage(messages.pageNewBadge)}</Badge>
                </div>
              </div>
              <StatefulButton
                className="px-4 rounded-0 scan-course-btn"
                labels={{
                  default: intl.formatMessage(run ? messages.rerunAnalysisButton : messages.startAnalysisButton),
                  pending: intl.formatMessage(run ? messages.rerunAnalysisButton : messages.startAnalysisButton),
                }}
                icons={{
                  default: '',
                  pending: <Icon src={SpinnerSimple} className="icon-spin" />,
                }}
                state={scanButtonState}
                onClick={() => startAnalysis.mutate()}
                disabled={startAnalysis.isPending}
                variant="primary"
                data-testid="start-course-analysis"
              />
            </div>
            <Card className="scan-card">
              <p className="px-3 py-1 small">{intl.formatMessage(messages.pageDescription)}</p>
              <hr />
              <CourseOptimizerReportBody
                run={run}
                isError={isError}
                startAnalysisError={startAnalysis.isError}
              />
            </Card>
          </article>
        </section>
      </Container>
    </>
  );
};

export default CourseOptimizerExtendedPage;
