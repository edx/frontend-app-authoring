import { useMemo } from 'react';
import { Badge, Collapsible } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseReport } from '../context/CourseReportContext';
import { selectTimeline, type TimelineSection } from '../selectors/timelineSelectors';
import { selectFindingsBySection, selectModuleLocationLabel } from '../selectors/findingsSelectors';
import { toModifier } from '../lib/cssModifier';
import { formatMinutesRounded as fmtMinutes } from '../lib/formatMinutes';
import messages from '../messages';
import { FlagStrip } from './FlagStrip';
import { TimelineTileButton } from './TimelineTileButton';
import type { CourseReport, Finding } from '../types/courseReport';
import './ModuleTimeline.scss';

const PX_PER_MIN_MODULE = 3;

const ModuleIssueRow = ({ report, finding }: { report: CourseReport | undefined; finding: Finding }) => {
  const location = selectModuleLocationLabel(report, finding);
  return (
    <li className="module-timeline__issue-row">
      <Badge pill className={`cor-badge cor-badge--severity-${toModifier(finding.severity)}`}>
        {finding.severity}
      </Badge>
      <Badge pill className={`cor-badge cor-badge--category-${toModifier(finding.type)}`}>
        {finding.type}
      </Badge>
      <span>
        {location} - {finding.summary}
      </span>
    </li>
  );
};

const ModuleRow = ({
  report,
  section,
  findings,
}: {
  report: CourseReport | undefined;
  section: TimelineSection;
  findings: Finding[];
}) => {
  const intl = useIntl();

  // Recompute each tile's position/width at the module track's own px/min
  // scale (finer than the course ribbon's) rather than rescaling the
  // ribbon's global-scale x/width, which would drift once rounding compounds
  // across many tiles.
  let cumMin = 0;
  const positionedTiles = section.tiles.map((tile) => {
    const left = Math.round(cumMin * PX_PER_MIN_MODULE);
    cumMin += tile.minutes;
    const width = Math.round(cumMin * PX_PER_MIN_MODULE) - left;
    return { tile, left, width };
  });
  const trackWidth = Math.round(section.totalMinutes * PX_PER_MIN_MODULE);

  return (
    <div className="module-timeline__row">
      <div className="module-timeline__row-header">
        <strong>{section.title}</strong>
        <span className="module-timeline__row-total">{fmtMinutes(section.totalMinutes)}</span>
      </div>

      <div className="module-timeline__track-scroll">
        <div className="module-timeline__track" style={{ width: trackWidth }}>
          <div className="module-timeline__tiles">
            {positionedTiles.map(({ tile, left, width }) => (
              <TimelineTileButton
                key={tile.componentId}
                tile={tile}
                left={left}
                width={width}
                height={30}
                showFindingsBadge
              />
            ))}
          </div>
          <FlagStrip width={trackWidth} spans={[{ x: 0, width: trackWidth, flags: section.flags }]} />
        </div>
      </div>

      {findings.length > 0 && (
        <div className="module-timeline__row-findings">
          <Collapsible title={intl.formatMessage(messages.moduleFindingsToggle, { count: findings.length })}>
            <Collapsible.Body>
              <ul className="module-timeline__issues">
                {findings.map((f) => (
                  <ModuleIssueRow key={f.id} report={report} finding={f} />
                ))}
              </ul>
            </Collapsible.Body>
          </Collapsible>
        </div>
      )}
    </div>
  );
};

export const ModuleTimeline = () => {
  const report = useCourseReport();
  const timeline = useMemo(() => selectTimeline(report), [report]);
  const findingsBySection = useMemo(() => selectFindingsBySection(report), [report]);

  return (
    <div>
      {timeline.sections.map((section) => (
        <ModuleRow
          key={section.sectionId}
          report={report}
          section={section}
          findings={findingsBySection[section.sectionId] ?? []}
        />
      ))}
    </div>
  );
};
