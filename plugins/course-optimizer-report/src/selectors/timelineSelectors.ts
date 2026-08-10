import { blockTypeModifier, familyForBlockType, labelForBlockType } from '../lib/blockTypeFamily';
import type { CourseReport } from '../types/courseReport';

export interface TimelineTile {
  componentId: string;
  displayName: string;
  blockType: string;
  typeLabel: string;
  family: 'passive' | 'active' | 'neutral';
  blockTypeModifier: string;
  minutes: number;
  x: number;
  width: number;
  subsectionTitle: string;
}

export interface TimelineSection {
  sectionId: string;
  title: string;
  x: number;
  width: number;
  totalMinutes: number;
  tiles: TimelineTile[];
  flags: string[];
}

export interface TimelineTick {
  x: number;
  major: boolean;
  label: string;
}

export interface Timeline {
  sections: TimelineSection[];
  ticks: TimelineTick[];
  totalMinutes: number;
  ribbonWidth: number;
}

const PX_PER_MIN = 2.2;
const TICK_INTERVAL_MIN = 15;

// Walks course -> sections -> subsections -> units -> components in document
// order (the contract's ordered-id-array shape) and lays every component end
// to end, width exactly proportional to its time_estimate. Ported from the
// prototype's reselect-memoized `selectTimeline`, but as a plain function
// over a `CourseReport` — this package holds its own fetched report rather
// than a Redux store, so there's no store state to memoize against; callers
// (e.g. via useMemo) are responsible for avoiding recompute on every render.
export function selectTimeline(report: CourseReport | undefined): Timeline {
  const sections: TimelineSection[] = [];
  const ticks: TimelineTick[] = [];
  let cumMin = 0;

  if (report) {
    const sectionsById = Object.fromEntries(report.sections.map((s) => [s.section_id, s]));
    const subsectionsById = Object.fromEntries(report.subsections.map((s) => [s.subsection_id, s]));
    const unitsById = Object.fromEntries(report.units.map((u) => [u.unit_id, u]));
    const componentsById = Object.fromEntries(report.components.map((c) => [c.component_id, c]));

    for (const sectionId of report.course.sectionIds) {
      const section = sectionsById[sectionId];
      if (section) {
        const sectionStartMin = cumMin;
        const tiles: TimelineTile[] = [];

        for (const subsectionId of section.subsectionIds) {
          const subsection = subsectionsById[subsectionId];
          if (subsection) {
            for (const unitId of subsection.unitIds) {
              const unit = unitsById[unitId];
              if (unit) {
                for (const componentId of unit.componentIds) {
                  const component = componentsById[componentId];
                  if (component) {
                    const { minutes } = component.time_estimate;
                    const x = Math.round(cumMin * PX_PER_MIN);
                    cumMin += minutes;
                    const width = Math.round(cumMin * PX_PER_MIN) - x;
                    tiles.push({
                      componentId,
                      displayName: component.display_name,
                      blockType: component.block_type,
                      typeLabel: labelForBlockType(component.block_type),
                      family: familyForBlockType(component.block_type),
                      blockTypeModifier: blockTypeModifier(component.block_type),
                      minutes,
                      x,
                      width,
                      subsectionTitle: subsection.display_name,
                    });
                  }
                }
              }
            }
          }
        }

        const x = Math.round(sectionStartMin * PX_PER_MIN);
        const width = Math.round(cumMin * PX_PER_MIN) - x;
        sections.push({
          sectionId,
          title: section.display_name,
          x,
          width,
          totalMinutes: cumMin - sectionStartMin,
          tiles,
          flags: section.learning_balance.flags,
        });
      }
    }
  }

  const totalMinutes = cumMin;
  for (let m = 0; m <= totalMinutes; m += TICK_INTERVAL_MIN) {
    const major = m % 60 === 0;
    ticks.push({
      x: Math.round(m * PX_PER_MIN),
      major,
      label: major ? `${m / 60}h` : '',
    });
  }

  return {
    sections,
    ticks,
    totalMinutes,
    ribbonWidth: Math.round(totalMinutes * PX_PER_MIN),
  };
}
