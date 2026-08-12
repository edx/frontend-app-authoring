# @openedx-plugins/course-optimizer-report

Fills `org.openedx.frontend.authoring.course_optimizer_extended_report.v1` on the Course
Optimizer page with a richer, LLM-assisted course report — time-on-task, learning
balance, an activity timeline, and accessibility/content-quality/pacing findings —
ported from the `xpert-labs/apps/course-optimizer` prototype ("Course Re-Run Assistant").

Renders as an additive section alongside (never instead of) the existing link-check
scan results; see `CourseOptimizerPage.tsx` and the `CourseOptimizerExtendedReportSlot`
plugin-slot in the host app.

## Data source

`data/apiHooks.ts`'s `useCourseOptimizerReport` polls Studio's `course_analysis_report_status`
proxy endpoint (`data/api.ts`'s `fetchCourseAnalysisReportStatus`), which in turn calls
xpert-ai-workflows server-side — this package never talks to that backend directly and
needs no separate auth client. A `null` result means the course has no analysis run yet,
which the widget renders as a "Start analysis" prompt rather than an error.

`useStartCourseAnalysisReport` kicks off a new run via the `course_analysis_report` proxy
endpoint (Studio generates the course export server-side; no upload flow needed here) and
invalidates the status query on success so the next poll picks up the new run.

`data/courseReportFixture.ts` (a typed copy of the `xpert-labs/apps/course-optimizer`
prototype's `contracts/course_report.fixture.json`) backs the selector and component
tests, standing in for a real `CourseReport`.

## Structure

- `types/courseReport.ts` — the `CourseReport` contract.
- `selectors/` — pure functions over a `CourseReport` (ported from the prototype's
  Redux/reselect selectors, since this package holds its report via React Query +
  Context rather than a store).
- `context/` — `CourseReportContext` (the fetched report) and `ReportUiContext`
  (selected timeline item, active filter pills) — this package's replacement for the
  prototype's `courseReportSlice`/`uiSlice`.
- `components/` — the ported UI (`SummaryBar`, the timeline family, `FindingsPanel`,
  `ExportFindingsButton`), built on Paragon components (`Badge`, `Button`, `Chip`,
  `Collapsible`, `DataTable`, `Icon`, `OverlayTrigger`, `ProgressBar`, `Stack`,
  `Tooltip`) in place of the prototype's raw HTML elements. The activity timeline's
  tile/ruler/section-label positioning has no Paragon equivalent and stays custom;
  everything else composes existing Paragon primitives.
- `styles/` — shared scss for the enum-driven color modifier classes (severity,
  finding category, learning family, block type) used across `components/`. Static,
  non-enum styling lives in a co-located `.scss` file per component; only genuinely
  per-instance computed values (timeline pixel positions) stay inline.
- `CourseOptimizerReportWidget.tsx` — the top-level component registered as the
  `RenderWidget` for the slot; the only piece that receives `courseId` from the host.
