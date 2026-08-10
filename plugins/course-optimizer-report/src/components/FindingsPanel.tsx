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
import { buildFindingRow } from './FindingRow';
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
    () => findings.map((f) => buildFindingRow(report, f, intl)),
    [findings, report, intl],
  );

  const columns = [
    { Header: intl.formatMessage(messages.findingsColumnSeverity), accessor: 'Severity' },
    { Header: intl.formatMessage(messages.findingsColumnCategory), accessor: 'Category' },
    { Header: intl.formatMessage(messages.findingsColumnLocation), accessor: 'Location' },
    { Header: intl.formatMessage(messages.findingsColumnSummary), accessor: 'Summary' },
    { Header: intl.formatMessage(messages.findingsColumnSuggestion), accessor: 'Suggestion' },
    { Header: intl.formatMessage(messages.findingsColumnAutoFixable), accessor: 'Auto-fixable' },
    { Header: intl.formatMessage(messages.findingsColumnScore), accessor: 'Score' },
    { Header: intl.formatMessage(messages.findingsColumnGuideline), accessor: 'Guideline' },
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
          <FilterPill<'All'>
            label="All"
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
          <FilterPill<'All'>
            label="All"
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
        <DataTable
          data={rows}
          itemCount={rows.length}
          columns={columns}
        />
      )}
    </section>
  );
};
