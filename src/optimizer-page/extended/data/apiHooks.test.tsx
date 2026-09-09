import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  act, initializeMocks, renderHook, waitFor,
} from '@src/testUtils';
import { courseReportFixture } from './courseReportFixture';
import { getCourseAnalysisReportStatusApiUrl, postCourseAnalysisReportApiUrl } from './api';
import { useCourseOptimizerReport, useStartCourseAnalysisReport } from './apiHooks';

jest.setTimeout(15000);

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useCourseOptimizerReport', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';

  it('resolves to null when the course has no run yet, then keeps polling', async () => {
    const { axiosMock } = initializeMocks();
    const url = getCourseAnalysisReportStatusApiUrl(courseId);
    axiosMock.onGet(url).reply(404);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseOptimizerReport(courseId), { wrapper });

    await waitFor(() => expect(result.current.isFetched).toBe(true));
    expect(result.current.data).toBeNull();

    // A run since started -- the next poll should pick it up without any
    // manual invalidation, since ACTIVE_STATUSES treats a null result as
    // still-pending.
    axiosMock.onGet(url).reply(200, {
      run_id: 'run-123', status: 'RUNNING', report: null, error: null,
    });
    await waitFor(() => expect(result.current.data?.status).toBe('RUNNING'), { timeout: 5000 });
  });

  it('stops polling once the run reaches a terminal status', async () => {
    const { axiosMock } = initializeMocks();
    const url = getCourseAnalysisReportStatusApiUrl(courseId);
    axiosMock.onGet(url).reply(200, {
      run_id: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseOptimizerReport(courseId), { wrapper });

    await waitFor(() => expect(result.current.data?.status).toBe('COMPLETE'));

    const callCountAtComplete = axiosMock.history.get.length;
    await new Promise((resolve) => { setTimeout(resolve, 2500); });
    expect(axiosMock.history.get.length).toBe(callCountAtComplete);
  });
});

describe('useStartCourseAnalysisReport', () => {
  const courseId = 'course-v1:2U+DS101+2025_T1';

  it('posts to the Studio proxy endpoint to queue a run', async () => {
    const { axiosMock } = initializeMocks();
    const url = postCourseAnalysisReportApiUrl(courseId);
    axiosMock.onPost(url).reply(202, { status: 'pending' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useStartCourseAnalysisReport(courseId), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(axiosMock.history.post[0].url).toEqual(url);
  });
});
