import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@src/testUtils';
import { resetCourseOptimizerReportMock } from './api';
import { useCourseOptimizerReport } from './apiHooks';

jest.setTimeout(15000);

describe('useCourseOptimizerReport', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';

  const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    resetCourseOptimizerReportMock(courseId);
  });

  it('polls until the pipeline reaches a terminal status, then stops', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseOptimizerReport(courseId), { wrapper });

    await waitFor(() => expect(result.current.data?.status).toBe('PENDING'));
    await waitFor(() => expect(result.current.data?.status).toBe('RUNNING'), { timeout: 5000 });
    await waitFor(() => expect(result.current.data?.status).toBe('PARTIAL'), { timeout: 5000 });
    await waitFor(() => expect(result.current.data?.status).toBe('COMPLETE'), { timeout: 5000 });

    const findingsAtComplete = result.current.data?.findings.length;

    // Once COMPLETE, refetchInterval returns false — give it a couple of
    // interval-lengths to prove no further poll advances the mock's tick
    // counter (which would otherwise change the findings count again).
    await new Promise((resolve) => { setTimeout(resolve, 2500); });
    expect(result.current.data?.status).toBe('COMPLETE');
    expect(result.current.data?.findings.length).toBe(findingsAtComplete);
  });
});
