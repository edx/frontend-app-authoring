import { PluginSlot } from '@openedx/frontend-plugin-framework/dist';

interface Props {
  courseId: string;
}

const CourseOptimizerExtendedReportSlot = ({ courseId }: Props) => (
  <PluginSlot
    id="org.openedx.frontend.authoring.course_optimizer_extended_report.v1"
    pluginProps={{ courseId }}
  />
);

export default CourseOptimizerExtendedReportSlot;
