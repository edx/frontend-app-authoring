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
  // Module view renders at a different px/min scale than the ribbon, so
  // it passes its own recomputed width.
  width?: number;
  // Set when a different section is highlighted in the full-course view.
  dimmed?: boolean;
  // Passed in so callers compute it once per tile instead of each caller
  // re-scanning report.findings independently.
  findings: Finding[];
}

// One clickable, hoverable segment of a timeline ribbon/track, shared by
// the full-course ribbon and each module's track. Findings-count badges
// render separately below the track (see FindingsBadgeStrip), not here.
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
