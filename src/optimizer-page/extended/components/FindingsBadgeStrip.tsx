import { Badge } from '@openedx/paragon';
import { toModifier } from '../lib/cssModifier';
import { SEVERITY_ORDER } from '../lib/severityColor';
import type { Finding } from '../types/courseReport';
import './FindingsBadgeStrip.scss';

export interface FindingsBadgeSpan {
  componentId: string;
  x: number;
  width: number;
  findings: Finding[];
}

// Renders one severity-colored, numbered badge per timeline tile that has
// findings, in a dedicated strip below the tiles track. Rendered below the
// track (rather than layered on top of/inside each tile) so a tile too
// narrow for a legible badge doesn't clip it -- each badge keeps its own
// natural size and is centered under its tile's midpoint instead of being
// stretched to the tile's own (often much narrower) width.
export const FindingsBadgeStrip = ({ spans, width }: { spans: FindingsBadgeSpan[]; width: number }) => {
  const flagged = spans.filter((s) => s.findings.length > 0);
  if (flagged.length === 0) { return null; }

  return (
    <div className="findings-badge-strip" style={{ width }}>
      {flagged.map((span) => {
        const highestSeverity = SEVERITY_ORDER.find((s) => span.findings.some((f) => f.severity === s)) ?? 'Low';
        const count = span.findings.length;
        const label = `${count} finding${count > 1 ? 's' : ''}`;
        return (
          <Badge
            key={span.componentId}
            pill
            title={label}
            aria-label={label}
            className={`findings-badge-strip__badge cor-badge cor-badge--severity-${toModifier(highestSeverity)}`}
            style={{ left: span.x + (span.width / 2) }}
          >
            {count}
          </Badge>
        );
      })}
    </div>
  );
};
