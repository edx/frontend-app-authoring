import {
  Badge, Icon, OverlayTrigger, ProgressBar, Tooltip,
} from '@openedx/paragon';
import { InfoOutline } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseReport } from '../context/CourseReportContext';
import { CATEGORY_ORDER } from '../lib/categoryColor';
import { toModifier } from '../lib/cssModifier';
import { formatMinutesRounded as fmtMinutes } from '../lib/formatMinutes';
import { SEVERITY_ORDER } from '../lib/severityColor';
import messages from '../messages';
import './SummaryBar.scss';

const InfoTooltip = ({ label }: { label: string }) => (
  <OverlayTrigger
    placement="top"
    overlay={<Tooltip id="summary-bar-info-tooltip">{label}</Tooltip>}
  >
    <Icon src={InfoOutline} className="summary-bar__info-icon" />
  </OverlayTrigger>
);

// Renders a count-per-key breakdown (severity or category) as a colored
// count badge + plain-text label per row. Always shows every key in
// `order`, even at zero, so the full label set (Critical/High/Medium/Low,
// etc.) stays visible.
const ColorBreakdown = <T extends string>({
  order,
  modifierPrefix,
  counts,
}: {
  order: T[];
  modifierPrefix: 'severity' | 'category';
  counts: Record<T, number>;
}) => (
  <div className="summary-bar__breakdown">
    {order.map((key) => (
      <span key={key} className="summary-bar__breakdown-row">
        <Badge pill className={`cor-badge cor-badge--${modifierPrefix}-${toModifier(key)}`}>
          {counts[key] ?? 0}
        </Badge>
        {key}
      </span>
    ))}
  </div>
  );

const ActivePassiveBar = ({ activeRatio }: { activeRatio: number }) => {
  const activePct = Math.round(activeRatio * 100);
  return (
    <div
      role="img"
      aria-label={`${activePct}% active, ${100 - activePct}% passive`}
      className="summary-bar__active-passive-bar"
    >
      <ProgressBar>
        <ProgressBar now={activePct} key="active" className="cor-progress-segment--active" />
        <ProgressBar now={100 - activePct} key="passive" className="cor-progress-segment--passive" />
      </ProgressBar>
    </div>
  );
};

export const SummaryBar = () => {
  const intl = useIntl();
  const report = useCourseReport();
  const timeSummary = report?.time_summary;
  const findingSummary = report?.finding_summary;

  if (!timeSummary || !findingSummary) { return null; }

  return (
    <section className="summary-bar">
      <table>
        <tbody>
          <tr>
            <td className="summary-bar__label">
              {intl.formatMessage(messages.summaryLearningTimeLabel)}
              <InfoTooltip label={intl.formatMessage(messages.summaryLearningTimeInfo)} />
            </td>
            <td>{fmtMinutes(timeSummary.total_minutes)}</td>
          </tr>
          <tr>
            <td className="summary-bar__label">
              {intl.formatMessage(messages.summaryActivePassiveLabel)}
            </td>
            <td>
              <div className="summary-bar__active-passive">
                <ActivePassiveBar activeRatio={timeSummary.active_ratio} />
                <span>
                  {intl.formatMessage(messages.summaryActivePassiveValue, {
                    active: fmtMinutes(timeSummary.active_minutes),
                    passive: fmtMinutes(timeSummary.passive_minutes),
                    percent: Math.round(timeSummary.active_ratio * 100),
                  })}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td className="summary-bar__label">
              {intl.formatMessage(messages.summaryMeetsTargetLabel)}
            </td>
            <td>
              {timeSummary.meets_target_hours
                ? intl.formatMessage(messages.summaryMeetsTargetYes)
                : intl.formatMessage(messages.summaryMeetsTargetNo)}
            </td>
          </tr>
        </tbody>
      </table>
      <table>
        <tbody>
          <tr>
            <td className="summary-bar__label">
              {intl.formatMessage(messages.summaryFindingsLabel)}
            </td>
            <td>{intl.formatMessage(messages.summaryFindingsTotal, { count: findingSummary.total })}</td>
          </tr>
          <tr>
            <td className="summary-bar__label">
              {intl.formatMessage(messages.summaryBySeverityLabel)}
            </td>
            <td>
              <ColorBreakdown order={SEVERITY_ORDER} modifierPrefix="severity" counts={findingSummary.by_severity} />
            </td>
          </tr>
          <tr>
            <td className="summary-bar__label">
              {intl.formatMessage(messages.summaryByCategoryLabel)}
            </td>
            <td>
              <ColorBreakdown order={CATEGORY_ORDER} modifierPrefix="category" counts={findingSummary.by_type} />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
};
