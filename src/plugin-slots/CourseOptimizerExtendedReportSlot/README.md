# CourseOptimizerExtendedReportSlot

### Slot ID: `org.openedx.frontend.authoring.course_optimizer_extended_report.v1`

Renders as an additive section on the Course Optimizer page, alongside the
existing link-check scan results. Gated behind the `enableCourseOptimizerExtendedReport`
waffle flag — this slot is not mounted at all when the flag is off, so no plugin
registered here will fetch or render anything in that case.

### Plugin Props
* `courseId` (`string`) — the current course's id. Plugins filling this slot are
  expected to use this to fetch and poll their own report data independently of the
  host page.
