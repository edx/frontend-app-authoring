// Mirrors xpert-labs/apps/course-optimizer's models/report.py (and
// models/pipeline.py for PipelineStatus) via its frontend prototype's
// types/courseReport.ts. Per xpert-api-services becoming the contract's
// source of truth once the backend port lands, this is a one-time port, not
// an ongoing sync target — see the Course Optimizer extension plan.

export type PipelineStatus = 'PENDING' | 'RUNNING' | 'PARTIAL' | 'COMPLETE' | 'FAILED';

export type FindingSource = 'deterministic' | 'llm';
export type FindingType = 'Error' | 'Accessibility' | 'Content Quality' | 'Pacing';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type HierarchyLevel = 'course' | 'section' | 'subsection' | 'unit' | 'component';

export type LearningType = 'active' | 'passive' | 'mixed';

// Normalized content category — a deliberate 6-value collapse of the fuller
// OLX block-type set. Separate from this package's own Passive/Active/Neutral
// coloring family, which is keyed off raw block_type instead — see
// lib/blockTypeFamily.ts.
export type ContentCategory = 'reading' | 'video' | 'problem' | 'assessment' | 'discussion' | 'other';

export interface TimeEstimate {
  minutes: number;
  source: 'provided' | 'computed';
}

export interface LearningBalance {
  active_ratio: number;
  flags: string[];
}

export interface Finding {
  id: string;
  item_id: string;
  hierarchy_level: HierarchyLevel;
  source: FindingSource;
  type: FindingType;
  severity: Severity;
  summary: string;
  suggestion: string;
  auto_fixable: boolean;
  guideline: string | null;
  score: number | null;
}

export interface CourseEntity {
  course_id: string;
  display_name: string;
  sectionIds: string[];
}

export interface SectionEntity {
  section_id: string;
  display_name: string;
  time_estimate: TimeEstimate;
  learning_balance: LearningBalance;
  subsectionIds: string[];
}

export interface SubsectionEntity {
  subsection_id: string;
  display_name: string;
  time_estimate: TimeEstimate;
  unitIds: string[];
}

export interface UnitEntity {
  unit_id: string;
  display_name: string;
  time_estimate: TimeEstimate;
  learning_type: LearningType;
  componentIds: string[];
}

export interface ComponentEntity {
  component_id: string;
  block_type: string;
  category: ContentCategory;
  display_name: string;
  is_graded: boolean;
  time_estimate: TimeEstimate;
}

export interface TimeSummary {
  total_minutes: number;
  active_minutes: number;
  passive_minutes: number;
  active_ratio: number;
  meets_target_hours: boolean;
}

export interface FindingSummary {
  total: number;
  by_severity: Record<Severity, number>;
  by_type: Record<FindingType, number>;
}

export interface CourseReport {
  generated_at: string;
  status: PipelineStatus;
  time_summary: TimeSummary;
  finding_summary: FindingSummary;

  course: CourseEntity;
  sections: SectionEntity[];
  subsections: SubsectionEntity[];
  units: UnitEntity[];
  components: ComponentEntity[];
  findings: Finding[];
}

// Studio's course_analysis_report_status proxy response. `report` is null
// until the pipeline reaches its Stage 2 snapshot -- PENDING/RUNNING runs
// have a status but nothing else to show yet.
export interface CourseAnalysisRun {
  runId: string;
  status: PipelineStatus;
  report: CourseReport | null;
  error: string | null;
}
