import type { FindingType } from '../types/courseReport';
import { orderPresentValues, rankAgainst } from './orderPresentValues';

// Display order for the currently known categories. Colors for each value
// live in ../styles/_shared.scss as .cor-badge--category-*,
// .cor-text--category-*, and .cor-filter-pill--category-* modifier classes;
// a category outside this list still renders, via _shared.scss's
// base-class fallback color.
export const KNOWN_CATEGORY_ORDER: FindingType[] = ['Error', 'Accessibility', 'Content Quality', 'Pacing'];

// Display/filter order: every known category always appears (even with zero
// matches), plus any category present in the data but outside the known
// set, appended at the end.
export const categoryDisplayOrder = (present: FindingType[]): FindingType[] => (
  orderPresentValues(KNOWN_CATEGORY_ORDER, present)
);

export const categoryRank = (category: FindingType): number => rankAgainst(KNOWN_CATEGORY_ORDER, category);
