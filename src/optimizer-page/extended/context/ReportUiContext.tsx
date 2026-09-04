import {
  createContext, useContext, useMemo, useState,
} from 'react';
import type { FindingType, Severity } from '../types/courseReport';

interface ReportUiState {
  selectedItemId: string | null;
  // Active severity/category pills. Empty means "no filter" (show
  // everything). Non-empty is a union: show findings matching ANY selected
  // pill.
  severityFilters: Severity[];
  typeFilters: FindingType[];
}

interface ReportUiContextValue extends ReportUiState {
  selectItem: (itemId: string | null) => void;
  toggleSeverityFilter: (severity: Severity) => void;
  toggleTypeFilter: (type: FindingType) => void;
  setSeverityFilters: (severities: Severity[]) => void;
  setTypeFilters: (types: FindingType[]) => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const ReportUiContext = createContext<ReportUiContextValue | null>(null);

// Replaces the prototype's Redux `uiSlice` — this package holds its own
// small piece of view-only state (selected timeline item, active filter
// pills) via plain React state instead of a store, matching this repo's
// preferred React Query + Context pattern (per this repo's CLAUDE.md) rather
// than adding to the host app's Redux slices.
export const ReportUiProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [severityFilters, setSeverityFiltersState] = useState<Severity[]>([]);
  const [typeFilters, setTypeFiltersState] = useState<FindingType[]>([]);

  const value = useMemo<ReportUiContextValue>(() => ({
    selectedItemId,
    severityFilters,
    typeFilters,
    selectItem: setSelectedItemId,
    toggleSeverityFilter: (severity) => setSeverityFiltersState((prev) => toggle(prev, severity)),
    toggleTypeFilter: (type) => setTypeFiltersState((prev) => toggle(prev, type)),
    setSeverityFilters: setSeverityFiltersState,
    setTypeFilters: setTypeFiltersState,
  }), [selectedItemId, severityFilters, typeFilters]);

  return (
    <ReportUiContext.Provider value={value}>
      {children}
    </ReportUiContext.Provider>
  );
};

export function useReportUi(): ReportUiContextValue {
  const ctx = useContext(ReportUiContext);
  if (!ctx) {
    throw new Error('useReportUi must be used within a ReportUiProvider');
  }
  return ctx;
}
