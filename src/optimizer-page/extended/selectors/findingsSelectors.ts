import type {
  CourseReport, Finding, FindingType, Severity,
} from '../types/courseReport';
import { selectItemLocations } from './locationSelectors';

export function selectFindingsForItem(report: CourseReport | undefined, itemId: string): Finding[] {
  return (report?.findings ?? []).filter((f) => f.item_id === itemId);
}

export interface FindingFilters {
  severityFilters: Severity[];
  typeFilters: FindingType[];
  selectedItemId: string | null;
}

// Shared by FindingsPanel's table and the export-findings button, so both
// always agree on which findings are "currently showing."
export function selectFilteredFindings(report: CourseReport | undefined, filters: FindingFilters): Finding[] {
  const { severityFilters, typeFilters, selectedItemId } = filters;
  return (report?.findings ?? []).filter((f) => {
    if (severityFilters.length > 0 && !severityFilters.includes(f.severity)) { return false; }
    if (typeFilters.length > 0 && !typeFilters.includes(f.type)) { return false; }
    if (selectedItemId && f.item_id !== selectedItemId) { return false; }
    return true;
  });
}

// Human-readable "module · activity"-style location for a finding. Course-
// level findings (no section) fall back to the course title; anything with
// an unresolvable item_id falls back to the raw id rather than hiding the row.
export function selectLocationLabel(report: CourseReport | undefined, finding: Finding): string {
  if (finding.hierarchy_level === 'course') {
    return report?.course?.display_name ?? finding.item_id;
  }
  const location = selectItemLocations(report)[finding.item_id];
  if (!location) { return finding.item_id; }
  return location.sectionTitle !== location.label
    ? `${location.sectionTitle} · ${location.label}`
    : location.label;
}

// Location label for the by-module view's issue list, which already shows
// the section (module) as the row it's nested under — so this surfaces the
// subsection/unit context instead of repeating the section.
export function selectModuleLocationLabel(report: CourseReport | undefined, finding: Finding): string {
  if (finding.hierarchy_level === 'course') {
    return report?.course?.display_name ?? finding.item_id;
  }
  const location = selectItemLocations(report)[finding.item_id];
  if (!location) { return finding.item_id; }
  if (finding.hierarchy_level === 'section' || finding.hierarchy_level === 'subsection') { return location.label; }
  // subsectionTitle/unitTitle are only guaranteed non-null when
  // hierarchy_level matches the depth they were populated at; guard against
  // interpolating a literal "null" if a finding's level and its resolved
  // location entry ever disagree.
  const parts = finding.hierarchy_level === 'unit'
    ? [location.subsectionTitle, location.label]
    : [location.subsectionTitle, location.unitTitle];
  const joined = parts.filter((p): p is string => Boolean(p)).join(' · ');
  return joined || location.label;
}

// Groups findings by the section (module) they fall under, for the
// by-module timeline view's per-module issue lists. Course-level findings
// have no owning section and are excluded.
export function selectFindingsBySection(report: CourseReport | undefined): Record<string, Finding[]> {
  const locations = selectItemLocations(report);
  const bySection: Record<string, Finding[]> = {};
  for (const f of (report?.findings ?? [])) {
    const sectionId = locations[f.item_id]?.sectionId;
    if (sectionId) {
      (bySection[sectionId] ??= []).push(f);
    }
  }
  return bySection;
}
