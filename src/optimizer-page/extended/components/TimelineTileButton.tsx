import { OverlayTrigger, Tooltip } from '@openedx/paragon';
import { useReportUi } from '../context/ReportUiContext';
import type { TimelineTile } from '../selectors/timelineSelectors';
import { formatMinutesPrecise as fmtMinutes } from '../lib/formatMinutes';
import type { Finding } from '../types/courseReport';
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
  // Passed in rather than looked up here so each caller (ContentTimeline,
  // ModuleTimeline) computes it once per tile instead of two callers each
  // independently re-scanning report.findings for the same componentId.
  findings: Finding[];
}

// One clickable, hoverable segment of a timeline ribbon/track. Shared by the
// full-course ribbon and each module's per-row track so tile appearance and
// interaction stay identical between the two views. Findings-count badges
// are rendered separately, below the track (see FindingsBadgeStrip) --
// putting them on the tile itself clipped on tiles narrower than the badge.
export const TimelineTileButton = ({
  tile, left, height, width, dimmed, findings,
}: TimelineTileButtonProps) => {
  const { selectItem } = useReportUi();

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
      />
    </OverlayTrigger>
  );
};
