import { useCallback, useMemo } from 'react';
import { Button } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseReport } from '../context/CourseReportContext';
import { useReportUi } from '../context/ReportUiContext';
import { selectFilteredFindings } from '../selectors/findingsSelectors';
import messages from '../messages';
import type { Finding } from '../types/courseReport';

const CSV_COLUMNS: Array<{ header: string; get: (f: Finding) => string }> = [
  { header: 'Severity', get: (f) => f.severity },
  { header: 'Category', get: (f) => f.type },
  { header: 'Item ID', get: (f) => f.item_id },
  { header: 'Summary', get: (f) => f.summary },
  { header: 'Suggestion', get: (f) => f.suggestion },
  { header: 'Auto-fixable', get: (f) => (f.auto_fixable ? 'Yes' : 'No') },
  { header: 'Score', get: (f) => (f.score === null ? '' : String(f.score)) },
  { header: 'Guideline', get: (f) => f.guideline ?? '' },
];

// Findings can contain LLM-authored text; a cell starting with =, +, -, or @
// opens as a formula in Excel/Sheets (CSV/Excel formula injection), so those
// need a leading single quote to force text interpretation before escaping.
const FORMULA_TRIGGER = /^[=+\-@]/;

function csvEscape(value: string): string {
  const safe = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function toCsv(findings: Finding[]): string {
  const rows = [
    CSV_COLUMNS.map((c) => c.header),
    ...findings.map((f) => CSV_COLUMNS.map((c) => csvEscape(String(c.get(f))))),
  ];
  return rows.map((r) => r.join(',')).join('\n');
}

// edX course_ids (e.g. "course-v1:HarvardX+CS50+X") contain characters that
// are awkward or unsafe in a filename (":", "+"), so collapse anything that
// isn't alphanumeric/dash/underscore into a single dash.
function slugifyCourseId(courseId: string): string {
  return courseId.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export const ExportFindingsButton = () => {
  const intl = useIntl();
  const report = useCourseReport();
  const { severityFilters, typeFilters, selectedItemId } = useReportUi();
  const findings = useMemo(
    () => selectFilteredFindings(report, { severityFilters, typeFilters, selectedItemId }),
    [report, severityFilters, typeFilters, selectedItemId],
  );

  const handleExport = useCallback(() => {
    const csv = toCsv(findings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cora-findings-${report?.course.course_id ? slugifyCourseId(report.course.course_id) : 'course'}.csv`;
    // Some browsers need the link in the DOM to reliably fire the download,
    // and revoking the object URL synchronously after click() can race the
    // download and truncate it — defer both past this tick.
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 0);
  }, [findings, report]);

  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={handleExport}
      disabled={findings.length === 0}
    >
      {intl.formatMessage(messages.exportFindingsButton, { count: findings.length })}
    </Button>
  );
};
