import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  summaryLearningTimeLabel: {
    id: 'course-authoring.course-optimizer-report.summary.learning-time.label',
    defaultMessage: 'Estimated learning time on platform',
    description: 'Label for the total estimated learning time stat in the Course Optimizer report summary bar',
  },
  summaryLearningTimeInfo: {
    id: 'course-authoring.course-optimizer-report.summary.learning-time.info',
    defaultMessage: 'LTI and third-party content is not included in this estimate',
    description: 'Tooltip explaining a caveat of the estimated learning time stat',
  },
  summaryActivePassiveLabel: {
    id: 'course-authoring.course-optimizer-report.summary.active-passive.label',
    defaultMessage: 'Active / passive',
    description: 'Label for the active vs. passive learning time breakdown',
  },
  summaryActivePassiveValue: {
    id: 'course-authoring.course-optimizer-report.summary.active-passive.value',
    defaultMessage: '{active} / {passive} ({percent}% active)',
    description: 'Active/passive minutes and percentage, e.g. "11 min / 36 min (23% active)"',
  },
  summaryMeetsTargetLabel: {
    id: 'course-authoring.course-optimizer-report.summary.meets-target.label',
    defaultMessage: 'Meets target hours',
    description: 'Label for whether the course meets its target hour band',
  },
  summaryMeetsTargetYes: {
    id: 'course-authoring.course-optimizer-report.summary.meets-target.yes',
    defaultMessage: 'Yes',
    description: 'Value shown when the course meets its target hour band',
  },
  summaryMeetsTargetNo: {
    id: 'course-authoring.course-optimizer-report.summary.meets-target.no',
    defaultMessage: 'No',
    description: 'Value shown when the course does not meet its target hour band',
  },
  summaryFindingsLabel: {
    id: 'course-authoring.course-optimizer-report.summary.findings.label',
    defaultMessage: 'Findings',
    description: 'Label for the total findings stat',
  },
  summaryFindingsTotal: {
    id: 'course-authoring.course-optimizer-report.summary.findings.total',
    defaultMessage: '{count} total',
    description: 'Total finding count, e.g. "5 total"',
  },
  summaryBySeverityLabel: {
    id: 'course-authoring.course-optimizer-report.summary.by-severity.label',
    defaultMessage: 'By severity',
    description: 'Label for the findings-by-severity breakdown',
  },
  summaryByCategoryLabel: {
    id: 'course-authoring.course-optimizer-report.summary.by-category.label',
    defaultMessage: 'By category',
    description: 'Label for the findings-by-category breakdown',
  },
  timelineHeading: {
    id: 'course-authoring.course-optimizer-report.timeline.heading',
    defaultMessage: 'Activity timeline',
    description: 'Heading for the course activity timeline section',
  },
  timelineDescription: {
    id: 'course-authoring.course-optimizer-report.timeline.description',
    defaultMessage: 'Every component in the course laid end to end in the order a learner meets it — width is exactly proportional to estimated time. Scroll right to walk the full {totalTime}. Hover any tile for details, click to filter findings below.',
    description: 'Explanation of how to read the activity timeline',
  },
  timelineViewFullCourse: {
    id: 'course-authoring.course-optimizer-report.timeline.view.full-course',
    defaultMessage: 'Full Course',
    description: 'Timeline view toggle: show the whole course as one ribbon',
  },
  timelineViewBySection: {
    id: 'course-authoring.course-optimizer-report.timeline.view.by-section',
    defaultMessage: 'By Section',
    description: 'Timeline view toggle: show one track per section/module',
  },
  moduleFindingsToggle: {
    id: 'course-authoring.course-optimizer-report.module.findings-toggle',
    defaultMessage: '{count, plural, one {{count} finding} other {{count} findings}}',
    description: 'Toggle label showing how many findings a module/section has',
  },
  findingsHeading: {
    id: 'course-authoring.course-optimizer-report.findings.heading',
    defaultMessage: 'Findings ({count})',
    description: 'Heading for the findings table, with the current filtered count',
  },
  findingsSeverityFilterLabel: {
    id: 'course-authoring.course-optimizer-report.findings.filter.severity.label',
    defaultMessage: 'Severity:',
    description: 'Label preceding the severity filter pills',
  },
  findingsCategoryFilterLabel: {
    id: 'course-authoring.course-optimizer-report.findings.filter.category.label',
    defaultMessage: 'Category:',
    description: 'Label preceding the category filter pills',
  },
  findingsFilterAll: {
    id: 'course-authoring.course-optimizer-report.findings.filter.all',
    defaultMessage: 'All',
    description: 'Filter pill that selects/deselects every severity or category at once',
  },
  findingsClearItemFilter: {
    id: 'course-authoring.course-optimizer-report.findings.clear-item-filter',
    defaultMessage: 'Clear item filter ({itemId})',
    description: 'Button clearing the filter applied by clicking a timeline tile',
  },
  findingsEmpty: {
    id: 'course-authoring.course-optimizer-report.findings.empty',
    defaultMessage: 'No findings match the current filters.',
    description: 'Shown when the findings table has no rows after filtering',
  },
  findingsColumnSeverity: {
    id: 'course-authoring.course-optimizer-report.findings.column.severity',
    defaultMessage: 'Severity',
    description: 'Findings table column header',
  },
  findingsColumnCategory: {
    id: 'course-authoring.course-optimizer-report.findings.column.category',
    defaultMessage: 'Category',
    description: 'Findings table column header',
  },
  findingsColumnLocation: {
    id: 'course-authoring.course-optimizer-report.findings.column.location',
    defaultMessage: 'Location',
    description: 'Findings table column header',
  },
  findingsColumnSummary: {
    id: 'course-authoring.course-optimizer-report.findings.column.summary',
    defaultMessage: 'Summary',
    description: 'Findings table column header',
  },
  findingsColumnSuggestion: {
    id: 'course-authoring.course-optimizer-report.findings.column.suggestion',
    defaultMessage: 'Suggestion',
    description: 'Findings table column header',
  },
  findingsColumnAutoFixable: {
    id: 'course-authoring.course-optimizer-report.findings.column.auto-fixable',
    defaultMessage: 'Auto-fixable',
    description: 'Findings table column header',
  },
  findingsColumnScore: {
    id: 'course-authoring.course-optimizer-report.findings.column.score',
    defaultMessage: 'Score',
    description: 'Findings table column header',
  },
  findingsColumnGuideline: {
    id: 'course-authoring.course-optimizer-report.findings.column.guideline',
    defaultMessage: 'Guideline',
    description: 'Findings table column header',
  },
  findingsAutoFixableYes: {
    id: 'course-authoring.course-optimizer-report.findings.auto-fixable.yes',
    defaultMessage: 'Yes',
    description: 'Value shown when a finding is auto-fixable',
  },
  findingsAutoFixableNo: {
    id: 'course-authoring.course-optimizer-report.findings.auto-fixable.no',
    defaultMessage: 'No',
    description: 'Value shown when a finding is not auto-fixable',
  },
  findingsGuidelineLink: {
    id: 'course-authoring.course-optimizer-report.findings.guideline-link',
    defaultMessage: 'Guideline',
    description: 'Link text for a finding\'s external guideline reference',
  },
  exportFindingsButton: {
    id: 'course-authoring.course-optimizer-report.export-findings.button',
    defaultMessage: 'Export findings ({count})',
    description: 'Button exporting the currently filtered findings as CSV',
  },
  reportStatusPending: {
    id: 'course-authoring.course-optimizer-report.status.pending',
    defaultMessage: 'Pending',
    description: 'Pipeline status label',
  },
  reportStatusRunning: {
    id: 'course-authoring.course-optimizer-report.status.running',
    defaultMessage: 'Running',
    description: 'Pipeline status label',
  },
  reportStatusPartial: {
    id: 'course-authoring.course-optimizer-report.status.partial',
    defaultMessage: 'Partial',
    description: 'Pipeline status label',
  },
  reportStatusComplete: {
    id: 'course-authoring.course-optimizer-report.status.complete',
    defaultMessage: 'Complete',
    description: 'Pipeline status label',
  },
  reportStatusFailed: {
    id: 'course-authoring.course-optimizer-report.status.failed',
    defaultMessage: 'Failed',
    description: 'Pipeline status label',
  },
  reportErrorHeading: {
    id: 'course-authoring.course-optimizer-report.error.heading',
    defaultMessage: 'The Course Optimizer report could not be loaded.',
    description: 'Heading shown when fetching the report fails',
  },
  notStartedHeading: {
    id: 'course-authoring.course-optimizer-report.not-started.heading',
    defaultMessage: 'Course analysis',
    description: 'Heading shown before a course has ever had an analysis run',
  },
  notStartedBody: {
    id: 'course-authoring.course-optimizer-report.not-started.body',
    defaultMessage: 'Run a deeper analysis of this course to see time-on-task, learning balance, and content-quality findings.',
    description: 'Explanation shown before a course has ever had an analysis run',
  },
  startAnalysisButton: {
    id: 'course-authoring.course-optimizer-report.start-analysis.button',
    defaultMessage: 'Start analysis',
    description: 'Button that kicks off a new Course Optimizer extended-analysis run',
  },
  rerunAnalysisButton: {
    id: 'course-authoring.course-optimizer-report.rerun-analysis.button',
    defaultMessage: 'Re-run analysis',
    description: 'Button that kicks off a new Course Optimizer extended-analysis run for a course that already has one',
  },
  startAnalysisError: {
    id: 'course-authoring.course-optimizer-report.start-analysis.error',
    defaultMessage: 'Could not start the analysis run. Please try again.',
    description: 'Shown when kicking off a new analysis run fails',
  },
  reportPendingBody: {
    id: 'course-authoring.course-optimizer-report.pending.body',
    defaultMessage: 'Analysis is starting…',
    description: 'Shown while an analysis run has started but has no report yet',
  },
});

export default messages;
