import { getConfig } from '@edx/frontend-platform';
import { getAuthService, getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import type MockAdapter from 'axios-mock-adapter';

import { initializeMocks, waitFor } from '@src/testUtils';
import {
  HOLD_REQUESTS_MS,
  LAST_REDIRECT_KEY,
  REDIRECT_COOLDOWN_MS,
  addStudioLoginRedirectInterceptor,
  closeSignInPrompt,
  getIsSignInPromptOpen,
  resetStudioLoginRedirect,
  shouldRetryQuery,
  signInToStudio,
} from '.';

const originalLocation = window.location;
const originalFetch = global.fetch;
const pageUrl = 'http://localhost/course/course-v1:org+101+run';

/** What the session check and the silent sign-in see. */
const studio: { hasSession: boolean, lmsSignedIn: boolean, checkFails: boolean, signInDone: Promise<void> } = {
  hasSession: false,
  lmsSignedIn: true,
  checkFails: false,
  signInDone: Promise.resolve(),
};

const mockStudioFetch = () => {
  global.fetch = jest.fn(async (_url: string, init?: RequestInit) => {
    if (init?.mode === 'no-cors') {
      // The silent sign-in: Studio's login creates a session if the user is signed in to the LMS.
      await studio.signInDone;
      studio.hasSession = studio.lmsSignedIn;
      return { type: 'opaque', status: 0 };
    }
    if (studio.checkFails) {
      throw new TypeError('Failed to fetch');
    }
    return studio.hasSession ? { type: 'cors', status: 400 } : { type: 'opaqueredirect', status: 0 };
  }) as unknown as typeof fetch;
};

const signInRequests = () => (global.fetch as jest.Mock).mock.calls.filter(([, init]) => init?.mode === 'no-cors');

/** Lets pending promise callbacks (interceptors, the session check) run. */
const flushPromises = () => new Promise((resolve) => { setTimeout(resolve, 0); });

/** Follows a request without waiting for it, as a held request does not settle. */
const track = (request: Promise<unknown>) => {
  const state: { settled: boolean, error?: any } = { settled: false };
  request.then(
    () => { state.settled = true; },
    (error) => {
      state.settled = true;
      state.error = error;
    },
  );
  return state;
};

describe('studio login redirect', () => {
  let axiosMock: MockAdapter;
  let assign: jest.Mock;
  let removeInterceptors: () => void;
  const studioUrl = (path: string) => `${getConfig().STUDIO_BASE_URL}${path}`;
  const get = (path: string) => getAuthenticatedHttpClient().get(studioUrl(path));
  const post = (path: string) => getAuthenticatedHttpClient().post(studioUrl(path));
  /** A Studio view that needs the session: the first request fails without one, the next one works. */
  const failOnceWithoutSession = (method: 'onGet' | 'onPost', path: string, failure: 'network' | 401 = 'network') => {
    const handler = axiosMock[method](studioUrl(path));
    if (failure === 'network') {
      handler.networkErrorOnce();
    } else {
      handler.replyOnce(failure);
    }
    axiosMock[method](studioUrl(path)).reply(200, { path });
  };

  beforeEach(() => {
    ({ axiosMock } = initializeMocks());
    assign = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: pageUrl, assign },
    });
    window.sessionStorage.clear();
    resetStudioLoginRedirect();
    Object.assign(studio, {
      hasSession: false, lmsSignedIn: true, checkFails: false, signInDone: Promise.resolve(),
    });
    mockStudioFetch();
    removeInterceptors = addStudioLoginRedirectInterceptor();
  });

  afterEach(() => {
    removeInterceptors();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('when the user is still signed in to the LMS', () => {
    it('signs in to Studio without leaving the page and sends the failed request again', async () => {
      failOnceWithoutSession('onGet', '/course_info_update/course-v1:org+101+run/');

      await expect(get('/course_info_update/course-v1:org+101+run/')).resolves.toMatchObject({ status: 200 });

      expect(signInRequests()).toHaveLength(1);
      const loginUrl = new URL(signInRequests()[0][0]);
      expect(loginUrl.pathname).toEqual('/login/');
      expect(loginUrl.searchParams.get('next')).toEqual('/xblock/');
      expect(assign).not.toHaveBeenCalled();
      expect(getIsSignInPromptOpen()).toBe(false);
    });

    it('does the same for a save that Studio answered with 401', async () => {
      failOnceWithoutSession('onPost', '/xblock/', 401);

      await expect(post('/xblock/')).resolves.toMatchObject({ status: 200 });

      expect(signInRequests()).toHaveLength(1);
      expect(assign).not.toHaveBeenCalled();
      expect(getIsSignInPromptOpen()).toBe(false);
    });

    it('forgets the CSRF token that Studio replaced when signing in', async () => {
      const clearCsrfTokenCache = jest.fn();
      getAuthService().getCsrfTokenService = () => ({ clearCsrfTokenCache });
      failOnceWithoutSession('onPost', '/xblock/');

      await expect(post('/xblock/')).resolves.toMatchObject({ status: 200 });

      expect(clearCsrfTokenCache).toHaveBeenCalledTimes(1);
    });

    it('signs in once for many failed requests', async () => {
      const paths = [1, 2, 3].map((id) => `/xblock/block-${id}`);
      paths.forEach((path) => failOnceWithoutSession('onGet', path));

      await expect(Promise.all(paths.map(get))).resolves.toHaveLength(3);

      expect(signInRequests()).toHaveLength(1);
    });

    it('holds back Studio requests made while signing in', async () => {
      let finishSignIn: () => void = () => {};
      studio.signInDone = new Promise((resolve) => { finishSignIn = resolve; });
      failOnceWithoutSession('onGet', '/xblock/block-1');
      axiosMock.onGet(studioUrl('/xblock/block-2')).reply(200, {});
      const first = get('/xblock/block-1');
      await waitFor(() => expect(signInRequests()).toHaveLength(1));

      const second = get('/xblock/block-2');
      await flushPromises();
      expect(axiosMock.history.get.map((request) => request.url)).not.toContain(studioUrl('/xblock/block-2'));
      finishSignIn();

      await expect(first).resolves.toMatchObject({ status: 200 });
      await expect(second).resolves.toMatchObject({ status: 200 });
    });

    it('does not send a request a third time', async () => {
      axiosMock.onGet(studioUrl('/xblock/block-1')).networkError();

      await expect(get('/xblock/block-1')).rejects.toBeDefined();

      expect(signInRequests()).toHaveLength(1);
      expect(assign).not.toHaveBeenCalled();
    });

    it('leaves a 401 alone when there is a Studio session', async () => {
      studio.hasSession = true;
      axiosMock.onPost(studioUrl('/api/discussions/v0/course/course-v1:org+101+run/sync_discussion_topics')).reply(401);

      await expect(post('/api/discussions/v0/course/course-v1:org+101+run/sync_discussion_topics'))
        .rejects.toMatchObject({ response: { status: 401 } });

      expect(signInRequests()).toHaveLength(0);
    });

    it.each([403, 404, 500])('leaves a Studio %d alone', async (status) => {
      axiosMock.onGet(studioUrl('/xblock/block-1')).reply(status);

      await expect(get('/xblock/block-1')).rejects.toMatchObject({ response: { status } });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('leaves failures of other services alone', async () => {
      const lmsUrl = `${getConfig().LMS_BASE_URL}/login_refresh`;
      axiosMock.onPost(lmsUrl).reply(401);

      await expect(getAuthenticatedHttpClient().post(lmsUrl)).rejects.toMatchObject({ response: { status: 401 } });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does nothing when the session check fails too', async () => {
      studio.checkFails = true;
      axiosMock.onGet(studioUrl('/xblock/block-1')).networkError();

      await expect(get('/xblock/block-1')).rejects.toBeDefined();

      expect(signInRequests()).toHaveLength(0);
      expect(assign).not.toHaveBeenCalled();
    });
  });

  describe('when the user has to sign in to the LMS again', () => {
    beforeEach(() => {
      studio.lmsSignedIn = false;
    });

    it('goes to the Studio login from a page that was loading data, without failing the request', async () => {
      axiosMock.onGet(studioUrl('/xblock/block-1')).networkError();

      const request = track(get('/xblock/block-1'));
      await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
      await flushPromises();

      const loginUrl = new URL(assign.mock.calls[0][0]);
      expect(loginUrl.origin).toEqual(new URL(getConfig().STUDIO_BASE_URL).origin);
      expect(loginUrl.pathname).toEqual('/login/');
      expect(loginUrl.searchParams.get('next')).toEqual(pageUrl);
      expect(request.settled).toBe(false);
    });

    it('goes to the login once when many requests fail together', async () => {
      const paths = [1, 2, 3, 4, 5].map((id) => `/xblock/block-${id}`);
      paths.forEach((path) => axiosMock.onGet(studioUrl(path)).reply(401));

      paths.forEach((path) => track(get(path)));
      await waitFor(() => expect(assign).toHaveBeenCalled());
      await flushPromises();

      expect(assign).toHaveBeenCalledTimes(1);
      expect(signInRequests()).toHaveLength(1);
    });

    it('asks the user before leaving the page when a save is in progress', async () => {
      axiosMock.onPost(studioUrl('/xblock/')).networkError();

      const request = track(post('/xblock/'));
      await waitFor(() => expect(getIsSignInPromptOpen()).toBe(true));
      await flushPromises();

      expect(assign).not.toHaveBeenCalled();
      expect(request.settled).toBe(false);
    });

    it('fails the save when the user stays on the page', async () => {
      axiosMock.onPost(studioUrl('/xblock/')).reply(401);
      const request = post('/xblock/');
      await waitFor(() => expect(getIsSignInPromptOpen()).toBe(true));

      closeSignInPrompt();

      await expect(request).rejects.toMatchObject({ response: { status: 401 } });
      expect(assign).not.toHaveBeenCalled();
    });

    it('keeps the save pending when the user signs in', async () => {
      axiosMock.onPost(studioUrl('/xblock/')).reply(401);
      const request = track(post('/xblock/'));
      await waitFor(() => expect(getIsSignInPromptOpen()).toBe(true));

      signInToStudio();
      await flushPromises();

      expect(assign).toHaveBeenCalledTimes(1);
      expect(getIsSignInPromptOpen()).toBe(false);
      expect(request.settled).toBe(false);
    });

    it('asks the user when the last login did not restore the session', async () => {
      window.sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now() - REDIRECT_COOLDOWN_MS / 2));
      axiosMock.onGet(studioUrl('/xblock/block-1')).reply(401);

      track(get('/xblock/block-1'));
      await waitFor(() => expect(getIsSignInPromptOpen()).toBe(true));

      expect(assign).not.toHaveBeenCalled();
    });

    it('goes to the login again once the cooldown has passed', async () => {
      window.sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now() - REDIRECT_COOLDOWN_MS * 2));
      axiosMock.onGet(studioUrl('/xblock/block-1')).reply(401);

      track(get('/xblock/block-1'));

      await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    });

    it('goes to the login when the user chooses to, even right after another login', () => {
      window.sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now()));

      signInToStudio();

      expect(assign).toHaveBeenCalledTimes(1);
    });

    it('holds back Studio requests while going to the login', async () => {
      const lmsUrl = `${getConfig().LMS_BASE_URL}/api/user/v1/me`;
      axiosMock.onGet(studioUrl('/xblock/block-1')).reply(401);
      axiosMock.onGet(studioUrl('/xblock/block-2')).reply(200, {});
      axiosMock.onGet(lmsUrl).reply(200, {});
      track(get('/xblock/block-1'));
      await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));

      const held = track(get('/xblock/block-2'));
      await expect(getAuthenticatedHttpClient().get(lmsUrl)).resolves.toMatchObject({ status: 200 });
      await flushPromises();

      expect(held.settled).toBe(false);
      expect(axiosMock.history.get.map((request) => request.url)).not.toContain(studioUrl('/xblock/block-2'));
    });

    it('sends held requests and fails held ones when the page is still open after a while', async () => {
      jest.useFakeTimers();
      try {
        axiosMock.onGet(studioUrl('/xblock/block-1')).reply(401);
        axiosMock.onGet(studioUrl('/xblock/block-2')).reply(200, {});
        const failed = track(get('/xblock/block-1'));
        await jest.advanceTimersByTimeAsync(0);
        expect(assign).toHaveBeenCalledTimes(1);
        const held = get('/xblock/block-2');

        await jest.advanceTimersByTimeAsync(HOLD_REQUESTS_MS);

        await expect(held).resolves.toMatchObject({ status: 200 });
        expect(failed.error).toMatchObject({ response: { status: 401 } });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('shouldRetryQuery', () => {
    it('does not retry a query that Studio answered with 401', () => {
      const error = { response: { status: 401, config: { url: studioUrl('/xblock/block-1') } } };

      expect(shouldRetryQuery(0, error)).toBe(false);
    });

    it('does not retry a query that failed for lack of a Studio session', async () => {
      studio.lmsSignedIn = false;
      window.sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now()));
      axiosMock.onGet(studioUrl('/xblock/block-1')).networkError();
      const request = track(get('/xblock/block-1'));
      await waitFor(() => expect(getIsSignInPromptOpen()).toBe(true));

      closeSignInPrompt();
      await waitFor(() => expect(request.settled).toBe(true));

      expect(shouldRetryQuery(0, request.error)).toBe(false);
    });

    it('retries other failed queries up to the React Query default', async () => {
      axiosMock.onGet(studioUrl('/xblock/block-1')).reply(500);
      const error = await get('/xblock/block-1').catch((e) => e);

      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(2, error)).toBe(true);
      expect(shouldRetryQuery(3, error)).toBe(false);
    });
  });
});
