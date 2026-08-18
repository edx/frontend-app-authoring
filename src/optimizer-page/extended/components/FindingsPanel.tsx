import { useMemo } from 'react';
import { Button, Chip, DataTable } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseReport } from '../context/CourseReportContext';
import { useReportUi } from '../context/ReportUiContext';
import { selectFilteredFindings } from '../selectors/findingsSelectors';
import { CATEGORY_ORDER } from '../lib/categoryColor';
import { toModifier } from '../lib/cssModifier';
import { SEVERITY_ORDER } from '../lib/severityColor';
import messages from '../messages';
import { buildFindingRow, safeGuidelineUrl, type FindingRowData } from './FindingRow';
import type { FindingType, Severity } from '../types/courseReport';
import './FindingsPanel.scss';

// Backed by FindingType/typeFilters, displayed to the user as "Category".
const CATEGORIES = CATEGORY_ORDER;

// A single toggleable filter pill: outlined when off, filled solid when on.
// Built on Paragon's Chip for its interaction/focus/a11y semantics
// (isSelected, keyboard activation); color comes from a
// cor-filter-pill--* modifier class.
const FilterPill = <T extends string>({
  label,
  modifierClass,
  active,
  onClick,
}: {
  label: T;
  modifierClass: string;
  active: boolean;
  onClick: () => void;
}) => (
  <Chip
    isSelected={active}
    onClick={onClick}
    className={`cor-filter-pill ${modifierClass} ${active ? 'cor-filter-pill--active' : ''}`}
  >
    {label}
  </Chip>
  );

// Orders severity/category values by their worst-to-best display order
// (rather than alphabetically) when a Severity/Category column is sorted.
function orderedSortType(order: string[]) {
  return (rowA: { values: Record<string, string> }, rowB: { values: Record<string, string> }, columnId: string) => (
    order.indexOf(rowA.values[columnId]) - order.indexOf(rowB.values[columnId])
  );
}

// Column Cell renderers -- declared at module scope (not inline in
// FindingsPanel's columns array) so DataTable/react-table sees a stable
// component identity across renders instead of a new one every time.
type CellProps = { row: { original: FindingRowData } };

const SeverityCell = ({ row }: CellProps) => (
  <span className={`cor-text--severity-${toModifier(row.original.severity)}`}>{row.original.severity}</span>
);

const CategoryCell = ({ row }: CellProps) => (
  <span className={`cor-text--category-${toModifier(row.original.category)}`}>{row.original.category}</span>
);

const SuggestionCell = ({ row }: CellProps) => (
  <span className="cor-text--muted">{row.original.suggestion}</span>
);

const AutoFixableCell = ({ row }: CellProps) => {
  const intl = useIntl();
  return row.original.autoFixable
    ? intl.formatMessage(messages.findingsAutoFixableYes)
    : intl.formatMessage(messages.findingsAutoFixableNo);
};

const ScoreCell = ({ row }: CellProps) => row.original.score ?? '—';

const GuidelineCell = ({ row }: CellProps) => {
  const intl = useIntl();
  const guidelineUrl = safeGuidelineUrl(row.original.guideline);
  if (!guidelineUrl) { return '—'; }
  return (
    <a
      href={guidelineUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${row.original.category} guideline for "${row.original.summary}"`}
    >
      {intl.formatMessage(messages.findingsGuidelineLink)}
    </a>
  );
};

export const FindingsPanel = () => {
  const intl = useIntl();
  const report = useCourseReport();
  const {
    severityFilters, typeFilters, selectedItemId, toggleSeverityFilter, toggleTypeFilter,
    setSeverityFilters, setTypeFilters, selectItem,
  } = useReportUi();

  const findings = useMemo(
    () => selectFilteredFindings(report, { severityFilters, typeFilters, selectedItemId }),
    [report, severityFilters, typeFilters, selectedItemId],
  );

  const rows = useMemo(
    () => findings.map((f) => buildFindingRow(report, f)),
    [findings, report],
  );

  const columns = [
    {
      Header: intl.formatMessage(messages.findingsColumnSeverity),
      accessor: 'severity',
      sortType: orderedSortType(SEVERITY_ORDER),
      Cell: SeverityCell,
    },
    {
      Header: intl.formatMessage(messages.findingsColumnCategory),
      accessor: 'category',
      sortType: orderedSortType(CATEGORY_ORDER),
      Cell: CategoryCell,
    },
    { Header: intl.formatMessage(messages.findingsColumnLocation), accessor: 'location' },
    {
      Header: intl.formatMessage(messages.findingsColumnSummary), accessor: 'summary', disableSortBy: true,
    },
    {
      Header: intl.formatMessage(messages.findingsColumnSuggestion),
      accessor: 'suggestion',
      disableSortBy: true,
      Cell: SuggestionCell,
    },
    {
      Header: intl.formatMessage(messages.findingsColumnAutoFixable),
      accessor: 'autoFixable',
      disableSortBy: true,
      Cell: AutoFixableCell,
    },
    {
      Header: intl.formatMessage(messages.findingsColumnScore),
      accessor: 'score',
      disableSortBy: true,
      Cell: ScoreCell,
    },
    {
      Header: intl.formatMessage(messages.findingsColumnGuideline),
      accessor: 'guideline',
      disableSortBy: true,
      Cell: GuidelineCell,
    },
  ];

  return (
    <section className="findings-panel">
      <h3 className="findings-panel__heading">
        {intl.formatMessage(messages.findingsHeading, { count: findings.length })}
      </h3>

      <div className="findings-panel__filters">
        <div className="findings-panel__filter-group">
          <span className="findings-panel__filter-label">
            {intl.formatMessage(messages.findingsSeverityFilterLabel)}
          </span>
          <FilterPill
            label={intl.formatMessage(messages.findingsFilterAll)}
            modifierClass="cor-filter-pill--all"
            active={severityFilters.length === SEVERITY_ORDER.length}
            onClick={() => setSeverityFilters(
              severityFilters.length === SEVERITY_ORDER.length ? [] : SEVERITY_ORDER,
            )}
          />
          {SEVERITY_ORDER.map((s: Severity) => (
            <FilterPill
              key={s}
              label={s}
              modifierClass={`cor-filter-pill--severity-${toModifier(s)}`}
              active={severityFilters.includes(s)}
              onClick={() => toggleSeverityFilter(s)}
            />
          ))}
        </div>
        <div className="findings-panel__filter-group">
          <span className="findings-panel__filter-label">
            {intl.formatMessage(messages.findingsCategoryFilterLabel)}
          </span>
          <FilterPill
            label={intl.formatMessage(messages.findingsFilterAll)}
            modifierClass="cor-filter-pill--all"
            active={typeFilters.length === CATEGORIES.length}
            onClick={() => setTypeFilters(typeFilters.length === CATEGORIES.length ? [] : CATEGORIES)}
          />
          {CATEGORIES.map((c: FindingType) => (
            <FilterPill
              key={c}
              label={c}
              modifierClass={`cor-filter-pill--category-${toModifier(c)}`}
              active={typeFilters.includes(c)}
              onClick={() => toggleTypeFilter(c)}
            />
          ))}
        </div>
        {selectedItemId && (
          <Button variant="tertiary" size="sm" onClick={() => selectItem(null)}>
            {intl.formatMessage(messages.findingsClearItemFilter, { itemId: selectedItemId })}
          </Button>
        )}
      </div>

      {findings.length === 0 ? (
        <p className="findings-panel__empty">{intl.formatMessage(messages.findingsEmpty)}</p>
      ) : (
        <div className="findings-panel__table-scroll">
          <DataTable
            isSortable
            data={rows}
            itemCount={rows.length}
            columns={columns}
          />
        </div>
      )}
    </section>
  );
};
