import type { Severity } from '../types/courseReport';

// Worst-to-best display order, shared by SummaryBar's breakdown and
// FindingsPanel's filter pills so both stay in sync with a single list.
// Colors for each value live in ../styles/_shared.scss as
// .cor-badge--severity-*, .cor-text--severity-*, and
// .cor-filter-pill--severity-* modifier classes.
export const SEVERITY_ORDER: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
