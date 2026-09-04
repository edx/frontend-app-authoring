import { useIntl } from '@edx/frontend-platform/i18n';
import type { IntlShape } from 'react-intl';
import messages from '../messages';
import './FlagStrip.scss';

const FLAG_MESSAGE: Record<string, keyof typeof messages> = {
  long_passive_stretch: 'flagLongPassiveStretch',
  no_knowledge_check: 'flagNoKnowledgeCheck',
  low_active_engagement: 'flagLowActiveEngagement',
};

// A flag the frontend doesn't recognize yet still renders, as its raw
// backend value, rather than being silently dropped.
function labelForFlag(intl: IntlShape, flag: string): string {
  const key = FLAG_MESSAGE[flag];
  return key ? intl.formatMessage(messages[key]) : flag;
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
  const intl = useIntl();
  const flagged = spans.filter((s) => s.flags.length > 0);
  if (flagged.length === 0) { return null; }

  return (
    <div className="flag-strip" style={{ width }}>
      {flagged.map((span) => {
        const label = span.flags.map((flag) => labelForFlag(intl, flag)).join(', ');
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
