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

  it('resolves to null when the course has no run yet, and does not keep polling', async () => {
    const { axiosMock } = initializeMocks();
    const url = getCourseAnalysisReportStatusApiUrl(courseId);
    axiosMock.onGet(url).reply(404);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseOptimizerReport(courseId, false), { wrapper });

    await waitFor(() => expect(result.current.isFetched).toBe(true));
    expect(result.current.data).toBeNull();

    const callCountAfterFirstFetch = axiosMock.history.get.length;
    await new Promise((resolve) => { setTimeout(resolve, 2500); });
    expect(axiosMock.history.get.length).toBe(callCountAfterFirstFetch);
  });

  it('keeps polling through a still-null result right after starting a run, until it appears', async () => {
    // postCourseAnalysisReport only queues a background export/upload task
    // (edx-platform#466) -- the run isn't visible to the status endpoint the
    // instant the POST resolves, so the immediate post-start refetch below
    // still 404s once before a run exists. Without `awaitingRun`, that null
    // result would stop polling for good (the bug a reviewer caught on #114).
    const { axiosMock } = initializeMocks();
    const statusUrl = getCourseAnalysisReportStatusApiUrl(courseId);
    const startUrl = postCourseAnalysisReportApiUrl(courseId);
    axiosMock.onGet(statusUrl).reply(404);
    axiosMock.onPost(startUrl).reply(202, { status: 'pending' });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => {
      const start = useStartCourseAnalysisReport(courseId);
      const report = useCourseOptimizerReport(courseId, start.isPending || start.isSuccess);
      return { report, start };
    }, { wrapper: Wrapper });

    await waitFor(() => expect(result.current.report.data).toBeNull());

    await act(async () => {
      await result.current.start.mutateAsync();
    });

    axiosMock.onGet(statusUrl).reply(200, {
      run_id: 'run-123', status: 'RUNNING', report: null, error: null,
    });
    await waitFor(() => expect(result.current.report.data?.status).toBe('RUNNING'), { timeout: 5000 });
  });

  it('stops polling once the run reaches a terminal status', async () => {
    const { axiosMock } = initializeMocks();
    const url = getCourseAnalysisReportStatusApiUrl(courseId);
    axiosMock.onGet(url).reply(200, {
      run_id: 'run-123', status: 'COMPLETE', report: courseReportFixture, error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseOptimizerReport(courseId, false), { wrapper });

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
