import { Badge, OverlayTrigger, Tooltip } from '@openedx/paragon';
import { useCourseReport } from '../context/CourseReportContext';
import { useReportUi } from '../context/ReportUiContext';
import { selectFindingsForItem } from '../selectors/findingsSelectors';
import type { TimelineTile } from '../selectors/timelineSelectors';
import { formatMinutesPrecise as fmtMinutes } from '../lib/formatMinutes';
import { toModifier } from '../lib/cssModifier';
import { SEVERITY_ORDER } from '../lib/severityColor';
import './TimelineTileButton.scss';

interface TimelineTileButtonProps {
  tile: TimelineTile;
  left: number;
  height: number;
  // Course view renders at the ribbon's own scale (tile.width already
  // matches it); module view renders at a different px/min scale and passes
  // its own recomputed width so left position and width stay consistent.
  width?: number;
  // Set when a different section is highlighted in the full-course view, so
  // this tile's own section can visually recede without changing its data.
  dimmed?: boolean;
}

// One clickable, hoverable segment of a timeline ribbon/track. Shared by the
// full-course ribbon and each module's per-row track so tile appearance and
// interaction stay identical between the two views.
export const TimelineTileButton = ({
  tile, left, height, width, dimmed,
}: TimelineTileButtonProps) => {
  const { selectItem } = useReportUi();
  const report = useCourseReport();
  const findings = selectFindingsForItem(report, tile.componentId);
  const highestSeverity = SEVERITY_ORDER.find((s) => findings.some((f) => f.severity === s));

  const tooltip = (
    <Tooltip id={`timeline-tile-tooltip-${tile.componentId}`}>
      <div className="timeline-tile__tooltip-type">{tile.typeLabel}</div>
      <div className="timeline-tile__tooltip-subsection">{tile.subsectionTitle}</div>
      <div className="timeline-tile__tooltip-detail">
        <span className="timeline-tile__tooltip-name">{tile.displayName}</span>
        <span>{fmtMinutes(tile.minutes)}</span>
      </div>
      {findings.length > 0 && (
        <div className="timeline-tile__tooltip-findings">
          {findings.length} finding{findings.length > 1 ? 's' : ''}
        </div>
      )}
    </Tooltip>
  );

  return (
    <OverlayTrigger placement="top" overlay={tooltip}>
      <button
        type="button"
        aria-label={`${tile.typeLabel}: ${tile.displayName}, ${tile.subsectionTitle}, ${fmtMinutes(tile.minutes)}${findings.length ? `, ${findings.length} finding${findings.length > 1 ? 's' : ''}` : ''}`}
        onClick={() => selectItem(tile.componentId)}
        className={`timeline-tile cor-tile--block-${tile.blockTypeModifier} ${dimmed ? 'timeline-tile--dimmed' : ''}`}
        style={{ left, width: Math.max(width ?? tile.width, 1), height }}
      >
        {findings.length > 0 && highestSeverity && (
          <Badge pill className={`timeline-tile__badge cor-badge cor-badge--severity-${toModifier(highestSeverity)}`}>
            {findings.length}
          </Badge>
        )}
      </button>
    </OverlayTrigger>
  );
};
