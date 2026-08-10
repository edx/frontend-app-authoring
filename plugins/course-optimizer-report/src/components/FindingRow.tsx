import type { ReactNode } from 'react';
import type { IntlShape } from 'react-intl';
import { toModifier } from '../lib/cssModifier';
import { selectLocationLabel } from '../selectors/findingsSelectors';
import messages from '../messages';
import type { CourseReport, Finding } from '../types/courseReport';

// `guideline` is backend-provided data rendered as an <a href>; only allow
// http(s) so a malicious/malformed value (e.g. a `javascript:` URL) can't
// execute when clicked.
function safeGuidelineUrl(guideline: string | null): string | null {
  if (!guideline) { return null; }
  try {
    const url = new URL(guideline);
    return url.protocol === 'http:' || url.protocol === 'https:' ? guideline : null;
  } catch {
    return null;
  }
}

export interface FindingRowData {
  Severity: ReactNode;
  Category: ReactNode;
  Location: ReactNode;
  Summary: ReactNode;
  Suggestion: ReactNode;
  'Auto-fixable': ReactNode;
  Score: ReactNode;
  Guideline: ReactNode;
}

// Builds one FindingsPanel DataTable row from a Finding, matching this
// repo's existing DataTable convention (e.g. BrokenLinkTable) of rendering
// JSX directly as cell content rather than per-column Cell renderers.
export function buildFindingRow(report: CourseReport | undefined, finding: Finding, intl: IntlShape): FindingRowData {
  const guidelineUrl = safeGuidelineUrl(finding.guideline);
  const location = selectLocationLabel(report, finding);
  return {
    Severity: (
      <span className={`cor-text--severity-${toModifier(finding.severity)}`}>{finding.severity}</span>
    ),
    Category: (
      <span className={`cor-text--category-${toModifier(finding.type)}`}>{finding.type}</span>
    ),
    Location: location,
    Summary: finding.summary,
    Suggestion: <span className="cor-text--muted">{finding.suggestion}</span>,
    'Auto-fixable': finding.auto_fixable
      ? intl.formatMessage(messages.findingsAutoFixableYes)
      : intl.formatMessage(messages.findingsAutoFixableNo),
    Score: finding.score ?? '—',
    Guideline: guidelineUrl ? (
      <a
        href={guidelineUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${finding.type} guideline for "${finding.summary}"`}
      >
        {intl.formatMessage(messages.findingsGuidelineLink)}
      </a>
    ) : '—',
  };
}
