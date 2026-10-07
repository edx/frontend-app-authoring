import type { Severity } from '../types/courseReport';
import { orderPresentValues, rankAgainst } from './orderPresentValues';

// Worst-to-best order for the currently known severities. Colors for each
// value live in ../styles/_shared.scss as .cor-badge--severity-*,
// .cor-text--severity-*, and .cor-filter-pill--severity-* modifier classes;
// a severity outside this list still renders, via _shared.scss's base-class
// fallback color.
export const KNOWN_SEVERITY_ORDER: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

// Display/filter order: every known severity always appears (even with zero
// matches), plus any severity present in the data but outside the known set,
// appended at the end.
export const severityDisplayOrder = (present: Severity[]): Severity[] => (
  orderPresentValues(KNOWN_SEVERITY_ORDER, present)
);

export const severityRank = (severity: Severity): number => rankAgainst(KNOWN_SEVERITY_ORDER, severity);
