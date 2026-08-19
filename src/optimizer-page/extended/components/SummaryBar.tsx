import type { ReactNode } from 'react';
import {
  Badge, Card, Icon, IconButtonWithTooltip, ProgressBar,
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
  <IconButtonWithTooltip
    tooltipPlacement="top"
    tooltipContent={label}
    src={InfoOutline}
    iconAs={Icon}
    alt={label}
    size="inline"
    className="summary-bar__info-icon"
  />
);

const StatTile = ({
  label, value, children,
}: { label: ReactNode; value?: ReactNode; children?: ReactNode }) => (
  <Card className="summary-bar__tile">
    <Card.Body>
      <div className="summary-bar__tile-label">{label}</div>
      {value !== undefined && <div className="summary-bar__tile-value">{value}</div>}
      {children}
    </Card.Body>
  </Card>
);

const TileSub = ({ children }: { children: ReactNode }) => (
  <div className="summary-bar__tile-sub">{children}</div>
);

// Count-per-key breakdown (severity or category). Always shows every key
// in `order`, even at zero, so the full label set stays visible.
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
        <span className="summary-bar__breakdown-label">{key}</span>
        <Badge pill className={`cor-badge cor-badge--count cor-badge--${modifierPrefix}-${toModifier(key)}`}>
          {counts[key] ?? 0}
        </Badge>
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

  if (!report || !timeSummary || !findingSummary) { return null; }

  const activePercent = Math.round(timeSummary.active_ratio * 100);
  const autoFixableCount = report.findings.filter((f) => f.auto_fixable).length;

  return (
    <section className="summary-bar">
      <StatTile
        label={(
          <>
            {intl.formatMessage(messages.summaryLearningTimeLabel)}
            <InfoTooltip label={intl.formatMessage(messages.summaryLearningTimeInfo)} />
          </>
        )}
        value={fmtMinutes(timeSummary.total_minutes)}
      >
        <TileSub>
          {intl.formatMessage(messages.summaryActsNote, {
            components: report.components.length,
            sections: report.sections.length,
          })}
        </TileSub>
      </StatTile>
      <StatTile
        label={intl.formatMessage(messages.summaryActivePassiveLabel)}
        value={intl.formatMessage(messages.summaryActivePercentValue, { percent: activePercent })}
      >
        <ActivePassiveBar activeRatio={timeSummary.active_ratio} />
        <TileSub>
          {intl.formatMessage(messages.summaryActivePassiveValue, {
            active: fmtMinutes(timeSummary.active_minutes),
            passive: fmtMinutes(timeSummary.passive_minutes),
            percent: activePercent,
          })}
        </TileSub>
      </StatTile>
      <StatTile
        label={intl.formatMessage(messages.summaryMeetsTargetLabel)}
        value={timeSummary.meets_target_hours
          ? intl.formatMessage(messages.summaryMeetsTargetYes)
          : intl.formatMessage(messages.summaryMeetsTargetNo)}
      />
      <StatTile
        label={intl.formatMessage(messages.summaryFindingsLabel)}
        value={findingSummary.total}
      >
        <TileSub>
          {intl.formatMessage(messages.summaryFindingsAutoFixable, { count: autoFixableCount })}
        </TileSub>
      </StatTile>
      <StatTile label={intl.formatMessage(messages.summaryBySeverityLabel)}>
        <ColorBreakdown order={SEVERITY_ORDER} modifierPrefix="severity" counts={findingSummary.by_severity} />
      </StatTile>
      <StatTile label={intl.formatMessage(messages.summaryByCategoryLabel)}>
        <ColorBreakdown order={CATEGORY_ORDER} modifierPrefix="category" counts={findingSummary.by_type} />
      </StatTile>
    </section>
  );
};
