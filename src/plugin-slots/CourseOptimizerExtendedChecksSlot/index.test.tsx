import { render, initializeMocks } from '@src/testUtils';
import CourseOptimizerExtendedChecksSlot from '.';

jest.mock('@openedx/frontend-plugin-framework/dist', () => ({
  // eslint-disable-next-line react/prop-types
  PluginSlot: ({ id, pluginProps }: { id: string; pluginProps: Record<string, unknown> }) => (
    <div data-testid="plugin-slot" data-id={id} data-course-id={pluginProps?.courseId as string} />
  ),
}));

describe('CourseOptimizerExtendedChecksSlot', () => {
  beforeEach(() => initializeMocks());

  it('renders with the slot id and forwards courseId as a plugin prop', () => {
    const { getByTestId } = render(<CourseOptimizerExtendedChecksSlot courseId="course-v1:org+course+run" />);
    const slot = getByTestId('plugin-slot');
    expect(slot).toHaveAttribute('data-id', 'org.openedx.frontend.authoring.course_optimizer_extended_checks.v1');
    expect(slot).toHaveAttribute('data-course-id', 'course-v1:org+course+run');
  });
});
