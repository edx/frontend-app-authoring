import { FC } from 'react';
import CourseOptimizerReportWidget from './extended';

const CourseOptimizerExtendedPage: FC<{ courseId: string }> = ({ courseId }) => (
  <CourseOptimizerReportWidget courseId={courseId} />
);

export default CourseOptimizerExtendedPage;
