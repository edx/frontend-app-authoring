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

// One severity-colored, numbered badge per tile with findings, in a strip
// below the tiles track. Each badge keeps its own natural size, centered
// under its tile's midpoint, rather than being stretched to (and clipped
// by) the tile's own width.
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
