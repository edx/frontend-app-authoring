import type { CourseReport } from '../types/courseReport';

export interface ItemLocation {
  label: string;
  sectionId: string;
  sectionTitle: string;
  // Populated for subsection/unit/component items only — null for a section
  // entry itself, since it has no subsection/unit above it.
  subsectionTitle: string | null;
  unitTitle: string | null;
}

// Walks course -> sections -> subsections -> units -> components once and
// records, for every non-course item id, its own display name plus its
// ancestor chain. Lets a Finding.item_id be turned into a human location
// string without a per-row tree walk. Ported from the prototype's
// reselect-memoized `selectItemLocations` as a plain function over a
// `CourseReport`.
export function selectItemLocations(report: CourseReport | undefined): Record<string, ItemLocation> {
  const locations: Record<string, ItemLocation> = {};
  if (!report) { return locations; }

  const sectionsById = Object.fromEntries(report.sections.map((s) => [s.section_id, s]));
  const subsectionsById = Object.fromEntries(report.subsections.map((s) => [s.subsection_id, s]));
  const unitsById = Object.fromEntries(report.units.map((u) => [u.unit_id, u]));
  const componentsById = Object.fromEntries(report.components.map((c) => [c.component_id, c]));

  for (const sectionId of report.course.sectionIds) {
    const section = sectionsById[sectionId];
    if (section) {
      locations[sectionId] = {
        label: section.display_name,
        sectionId,
        sectionTitle: section.display_name,
        subsectionTitle: null,
        unitTitle: null,
      };

      for (const subsectionId of section.subsectionIds) {
        const subsection = subsectionsById[subsectionId];
        if (subsection) {
          locations[subsectionId] = {
            label: subsection.display_name,
            sectionId,
            sectionTitle: section.display_name,
            subsectionTitle: subsection.display_name,
            unitTitle: null,
          };

          for (const unitId of subsection.unitIds) {
            const unit = unitsById[unitId];
            if (unit) {
              locations[unitId] = {
                label: unit.display_name,
                sectionId,
                sectionTitle: section.display_name,
                subsectionTitle: subsection.display_name,
                unitTitle: unit.display_name,
              };

              for (const componentId of unit.componentIds) {
                const component = componentsById[componentId];
                if (component) {
                  locations[componentId] = {
                    label: component.display_name,
                    sectionId,
                    sectionTitle: section.display_name,
                    subsectionTitle: subsection.display_name,
                    unitTitle: unit.display_name,
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return locations;
}
