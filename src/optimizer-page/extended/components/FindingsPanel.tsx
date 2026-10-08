import { useMemo } from 'react';
import { Button, Chip, DataTable } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseReport } from '../context/CourseReportContext';
import { useReportUi } from '../context/ReportUiContext';
import { selectFilteredFindings } from '../selectors/findingsSelectors';
import { categoryDisplayOrder, categoryRank } from '../lib/categoryColor';
import { toModifier } from '../lib/cssModifier';
import { severityDisplayOrder, severityRank } from '../lib/severityColor';
import messages from '../messages';
import { buildFindingRow, safeGuidelineUrl, type FindingRowData } from './FindingRow';
import type { FindingType, Severity } from '../types/courseReport';
import './FindingsPanel.scss';

// A toggleable filter pill: outlined when off, filled when on. Built on
// Paragon's Chip for its interaction/a11y semantics.
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

// Orders severity/category values by their worst-to-best display rank
// (rather than alphabetically) when a Severity/Category column is sorted.
function orderedSortType<T extends string>(rank: (value: T) => number) {
  return (rowA: { values: Record<string, T> }, rowB: { values: Record<string, T> }, columnId: string) => (
    rank(rowA.values[columnId]) - rank(rowB.values[columnId])
  );
}

// Cell renderers stay at module scope for a stable component identity
// across renders (react-table treats a new Cell function as a new column).
type CellProps = { row: { original: FindingRowData } };

const taggedCellClassName = (field: 'severity' | 'category', value: string) => `cor-text--tagged cor-text--${field}-${toModifier(value)}`;

const SeverityCell = ({ row }: CellProps) => (
  <span className={taggedCellClassName('severity', row.original.severity)}>{row.original.severity}</span>
);

const CategoryCell = ({ row }: CellProps) => (
  <span className={taggedCellClassName('category', row.original.category)}>{row.original.category}</span>
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

  const severities = useMemo(
    () => severityDisplayOrder((report?.findings ?? []).map((f) => f.severity)),
    [report],
  );
  const categories = useMemo(
    () => categoryDisplayOrder((report?.findings ?? []).map((f) => f.type)),
    [report],
  );

  const columns = [
    {
      Header: intl.formatMessage(messages.findingsColumnSeverity),
      accessor: 'severity',
      sortType: orderedSortType(severityRank),
      Cell: SeverityCell,
    },
    {
      Header: intl.formatMessage(messages.findingsColumnCategory),
      accessor: 'category',
      sortType: orderedSortType(categoryRank),
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
            active={severityFilters.length === severities.length}
            onClick={() => setSeverityFilters(
              severityFilters.length === severities.length ? [] : severities,
            )}
          />
          {severities.map((s: Severity) => (
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
            active={typeFilters.length === categories.length}
            onClick={() => setTypeFilters(typeFilters.length === categories.length ? [] : categories)}
          />
          {categories.map((c: FindingType) => (
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
