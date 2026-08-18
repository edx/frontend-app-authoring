import type { FindingType } from '../types/courseReport';

// Display order, shared by SummaryBar's breakdown and FindingsPanel's filter
// pills so both stay in sync with a single list. Colors for each value live
// in ../styles/_shared.scss as .cor-badge--category-*, .cor-text--category-*,
// and .cor-filter-pill--category-* modifier classes.
export const CATEGORY_ORDER: FindingType[] = ['Error', 'Accessibility', 'Content Quality', 'Pacing'];
