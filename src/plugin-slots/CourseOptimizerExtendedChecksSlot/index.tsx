import { PluginSlot } from '@openedx/frontend-plugin-framework/dist';

interface Props {
  courseId: string;
}

const CourseOptimizerExtendedChecksSlot = ({ courseId }: Props) => (
  <PluginSlot
    id="org.openedx.frontend.authoring.course_optimizer_extended_checks.v1"
    pluginProps={{ courseId }}
  />
);

export default CourseOptimizerExtendedChecksSlot;
