import { createContext, useContext } from 'react';
import type { CourseReport } from '../types/courseReport';

const CourseReportContext = createContext<CourseReport | undefined>(undefined);

export const CourseReportProvider = CourseReportContext.Provider;

// Read within this package's own component tree only — the fetched report
// lives here instead of a Redux store or prop-drilled through every
// component, mirroring how the prototype's Redux store held it, but scoped
// to this widget rather than a global store.
export function useCourseReport(): CourseReport | undefined {
  return useContext(CourseReportContext);
}
