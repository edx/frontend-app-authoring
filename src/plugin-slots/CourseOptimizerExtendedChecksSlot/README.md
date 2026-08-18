# CourseOptimizerExtendedChecksSlot

### Slot ID: `org.openedx.frontend.authoring.course_optimizer_extended_checks.v1`

Replaces the entire Course Optimizer page when the `enableCourseOptimizerExtendedChecks`
waffle flag is enabled, rendered via `CourseOptimizerExtendedPage`. When the flag is off,
the legacy `CourseOptimizerPage` (link-check scan results) is rendered instead and this
slot is not mounted at all, so no plugin registered here will fetch or render anything
in that case.

### Plugin Props
* `courseId` (`string`) — the current course's id. Plugins filling this slot are
  expected to use this to fetch and poll their own report data, and to own their
  own page-level concerns (title, layout, error handling), since nothing from the
  legacy page is shared.
