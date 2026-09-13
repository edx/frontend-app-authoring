import { selectLocationLabel } from '../selectors/findingsSelectors';
import type { CourseReport, Finding } from '../types/courseReport';

// guideline is backend-provided; only allow http(s) so a `javascript:` URL
// can't execute when clicked.
export function safeGuidelineUrl(guideline: string | null): string | null {
  if (!guideline) { return null; }
  try {
    const url = new URL(guideline);
    return url.protocol === 'http:' || url.protocol === 'https:' ? guideline : null;
  } catch {
    return null;
  }
}

export interface FindingRowData {
  severity: Finding['severity'];
  category: Finding['type'];
  location: string;
  summary: string;
  suggestion: string;
  autoFixable: boolean;
  score: number | null;
  guideline: string | null;
}

// Raw values (not JSX) so DataTable's isSortable can compare them directly;
// FindingsPanel's Cell renderers apply the styled presentation.
export function buildFindingRow(report: CourseReport | undefined, finding: Finding): FindingRowData {
  return {
    severity: finding.severity,
    category: finding.type,
    location: selectLocationLabel(report, finding),
    summary: finding.summary,
    suggestion: finding.suggestion,
    autoFixable: finding.auto_fixable,
    score: finding.score,
    guideline: finding.guideline,
  };
}
