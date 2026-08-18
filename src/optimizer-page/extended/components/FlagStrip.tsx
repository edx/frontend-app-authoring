import './FlagStrip.scss';

const FLAG_LABEL: Record<string, string> = {
  long_passive_stretch: 'Long passive stretch',
  no_knowledge_check: 'No knowledge check',
  low_active_engagement: 'Low active engagement',
};

function labelForFlag(flag: string): string {
  return FLAG_LABEL[flag] ?? flag;
}

export interface FlagSpan {
  x: number;
  width: number;
  flags: string[];
}

// Thin marker strip rendered under a timeline (course-wide or per-module),
// highlighting sections flagged by SectionEntity.learning_balance.flags —
// e.g. a stretch with too little active learning. One span per flagged
// section, sized to that section's timeline width.
export const FlagStrip = ({ spans, width }: { spans: FlagSpan[]; width: number }) => {
  const flagged = spans.filter((s) => s.flags.length > 0);
  if (flagged.length === 0) { return null; }

  return (
    <div className="flag-strip" style={{ width }}>
      {flagged.map((span) => {
        const label = span.flags.map(labelForFlag).join(', ');
        return (
          <div
            key={span.x}
            role="img"
            aria-label={label}
            title={label}
            className="flag-strip__span"
            style={{ left: span.x, width: Math.max(span.width, 1) }}
          />
        );
      })}
    </div>
  );
};
