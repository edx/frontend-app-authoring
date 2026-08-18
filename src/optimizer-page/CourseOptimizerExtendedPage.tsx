import { FC } from 'react';
import CourseOptimizerExtendedChecksSlot from '../plugin-slots/CourseOptimizerExtendedChecksSlot';

const CourseOptimizerExtendedPage: FC<{ courseId: string }> = ({ courseId }) => (
  <CourseOptimizerExtendedChecksSlot courseId={courseId} />
);

export default CourseOptimizerExtendedPage;
