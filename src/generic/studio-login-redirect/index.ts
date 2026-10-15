import { getConfig } from '@edx/frontend-platform';
import { getAuthService, getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

/** sessionStorage key holding the time of the last redirect to the Studio login. */
export const LAST_REDIRECT_KEY = 'studioLoginRedirectAt';

/** A login that did not restore the session must not be retried in a loop. */
export const REDIRECT_COOLDOWN_MS = 60_000;

/**
 * How long Studio requests and their errors are held back after starting the login. If the page is
 * still here after that, the navigation was cancelled (e.g. by an unsaved changes prompt): the held
 * requests are sent and the held errors reach the page.
 */
export const HOLD_REQUESTS_MS = 15_000;

/**
 * A Studio URL that needs the Studio session and is cheap to call. With a session, a GET to it
 * answers 400 ("Only instance creation is supported without a usage key") without reading anything.
 */
const SESSION_CHECK_PATH = '/xblock/';

/** Marks an error caused by the missing Studio session. A property, as error handlers wrap errors. */
const STUDIO_SESSION_ERROR = Symbol('studioSessionError');

/** Request config flag: sent again after signing in, so it is never sent a third time. */
const RESENT = 'studioLoginRedirectResent';

/** A request held back because there is no Studio session. */
interface HeldRequest {
  isSave: boolean;
  /** There is a Studio session now: send the request (again). */
  send: () => void;
  /** There is still no Studio session: give the page what it would have got without this. */
  fail: () => void;
}

let isSigningIn = false;
let isRedirecting = false;
let holdRequestsTimer: ReturnType<typeof setTimeout> | undefined;
let sessionCheck: Promise<boolean> | null = null;
let isSignInPromptOpen = false;
const signInPromptListeners = new Set<() => void>();
let held: HeldRequest[] = [];

const releaseHeld = (hasSession: boolean) => {
  const toRelease = held;
  held = [];
  toRelease.forEach((request) => (hasSession ? request.send() : request.fail()));
};

const isSave = (config: { method?: string }) => (config.method ?? 'get').toLowerCase() !== 'get';

const isStudioUrl = (url?: string, baseUrl?: string): boolean => {
  const studioBaseUrl = getConfig().STUDIO_BASE_URL;
  if (!studioBaseUrl || !url) {
    return false;
  }
  try {
    return new URL(url, baseUrl ?? window.location.href).origin === new URL(studioBaseUrl).origin;
  } catch {
    return false;
  }
};

/**
 * Whether the error is a 401 answered by Studio itself.
 *
 * A 401 from the LMS (e.g. the token refresh of a signed-out user) is handled by
 * frontend-platform and must not send the user to the Studio login.
 */
export const isStudioUnauthorizedError = (error: any): boolean => {
  if (error?.response?.status !== 401) {
    return false;
  }
  const config = error.response.config ?? error.config;
  return isStudioUrl(config?.url, config?.baseURL);
};

/** Whether the request failed because there is no Studio session, either as a 401 or as found below. */
export const isStudioSessionError = (error: any): boolean => (
  isStudioUnauthorizedError(error) || error?.[STUDIO_SESSION_ERROR] === true
);

/** The request got no response at all. Cancelled and timed out requests do not count. */
const failedWithoutResponse = (error: any): boolean => (
  !!error?.config && !error.response && !['ERR_CANCELED', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code)
);

const checkStudioSession = async (): Promise<boolean> => {
  try {
    const response = await fetch(new URL(SESSION_CHECK_PATH, getConfig().STUDIO_BASE_URL).href, {
      credentials: 'include',
      redirect: 'manual',
      cache: 'no-store',
    });
    return response.type !== 'opaqueredirect';
  } catch {
    // The check failed too (e.g. Studio is down): that is not a reason to sign in again.
    return true;
  }
};

/**
 * Whether this browser has a Studio session.
 *
 * Without one, Studio redirects a request to its login. `fetch` with `redirect: 'manual'` can see that
 * redirect, which an XHR cannot. Requests made at the same time share one check.
 */
export const hasStudioSession = (): Promise<boolean> => {
  if (!sessionCheck) {
    sessionCheck = checkStudioSession().finally(() => {
      sessionCheck = null;
    });
  }
  return sessionCheck;
};

/**
 * Sign in to Studio without leaving the page. This works while the user is signed in to the LMS.
 *
 * Studio's login is a chain of redirects through the LMS. The page's own requests cannot follow it, as
 * CORS stops them at the LMS, but a `no-cors` request can, and the session cookie it ends with is kept.
 */
const signInSilently = async (): Promise<boolean> => {
  const loginUrl = new URL('/login/', getConfig().STUDIO_BASE_URL);
  loginUrl.searchParams.set('next', SESSION_CHECK_PATH);
  try {
    await fetch(loginUrl.href, { mode: 'no-cors', credentials: 'include', cache: 'no-store' });
  } catch {
    // Whether it worked is checked below.
  }
  return hasStudioSession();
};

const setSignInPromptOpen = (isOpen: boolean) => {
  isSignInPromptOpen = isOpen;
  signInPromptListeners.forEach((listener) => listener());
};

/** Subscribe to the sign-in prompt opening or closing (for `useSyncExternalStore`). */
export const subscribeToSignInPrompt = (listener: () => void) => {
  signInPromptListeners.add(listener);
  return () => {
    signInPromptListeners.delete(listener);
  };
};

/** Whether the user is being asked to sign in to Studio again. */
export const getIsSignInPromptOpen = () => isSignInPromptOpen;

/** The user chose to stay on the page, so the requests held back while asking fail now. */
export const closeSignInPrompt = () => {
  setSignInPromptOpen(false);
  releaseHeld(false);
};

const redirectedRecently = (): boolean => {
  try {
    const lastRedirect = Number(window.sessionStorage.getItem(LAST_REDIRECT_KEY));
    return lastRedirect > 0 && Date.now() - lastRedirect < REDIRECT_COOLDOWN_MS;
  } catch {
    return false;
  }
};

const goToStudioLogin = () => {
  isRedirecting = true;
  clearTimeout(holdRequestsTimer);
  holdRequestsTimer = setTimeout(() => {
    isRedirecting = false;
    releaseHeld(false);
  }, HOLD_REQUESTS_MS);
  try {
    window.sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now()));
  } catch {
    // Without sessionStorage there is no loop guard across page loads; still redirect once.
  }
  const loginUrl = new URL('/login/', getConfig().STUDIO_BASE_URL);
  loginUrl.searchParams.set('next', window.location.href);
  window.location.assign(loginUrl.href);
};

/**
 * Send the browser to the Studio login, returning to the current page afterwards.
 *
 * Many of the endpoints this app calls are authenticated by the Studio session
 * and not by the JWT cookies, so the Studio session can lapse while the user is
 * still signed in to the LMS. One page then fails many requests at once, and
 * all of them must share a single navigation.
 *
 * @returns whether a navigation was started.
 */
export const redirectToStudioLogin = (): boolean => {
  if (!getConfig().STUDIO_BASE_URL || isRedirecting || redirectedRecently()) {
    return false;
  }
  goToStudioLogin();
  return true;
};

/** The user chose to sign in from the prompt, so this goes to the login even right after another one. */
export const signInToStudio = () => {
  setSignInPromptOpen(false);
  if (getConfig().STUDIO_BASE_URL && !isRedirecting) {
    goToStudioLogin();
  }
};

/**
 * Get a Studio session back for the held requests.
 *
 * While the user is signed in to the LMS, this signs in to Studio without leaving the page and sends
 * the requests again, so the page never sees them fail. Otherwise the user has to sign in again, which
 * means leaving the page. A page that was only loading data goes to the login at once. A page with a
 * save in progress asks first, so that the user does not lose the change. So does a page whose last
 * login did not restore the session.
 */
const restoreStudioSession = async () => {
  isSigningIn = true;
  const signedIn = await signInSilently();
  isSigningIn = false;
  if (signedIn) {
    // Signing in gave Studio a new CSRF token: forget the old one, or every save from now on is refused.
    getAuthService()?.getCsrfTokenService?.()?.clearCsrfTokenCache();
    releaseHeld(true);
  } else if (held.some((request) => request.isSave) || !redirectToStudioLogin()) {
    setSignInPromptOpen(true);
  }
};

/**
 * Handle requests that Studio refuses because there is no Studio session.
 *
 * Studio refuses them with a 401 when it has the companion openedx-platform change. Until then it
 * redirects them to its login, and the browser blocks that redirect for a cross-origin request, so
 * the request fails with no response. hasStudioSession() tells both apart from other failures.
 *
 * Such requests, and the Studio requests made while the session is being restored, are held back
 * until restoreStudioSession() is done: the page does not see failures that are about to be fixed.
 * Studio requests made meanwhile would also start logins of their own and break the one in progress.
 *
 * @returns a function that removes the interceptors.
 */
export const addStudioLoginRedirectInterceptor = (httpClient = getAuthenticatedHttpClient()) => {
  const requestInterceptor = httpClient.interceptors.request.use((config) => {
    if ((isSigningIn || isRedirecting) && isStudioUrl(config.url, config.baseURL)) {
      return new Promise<typeof config>((resolve) => {
        const send = () => resolve(config);
        held.push({ isSave: isSave(config), send, fail: send });
      });
    }
    return config;
  });
  const responseInterceptor = httpClient.interceptors.response.use(undefined, async (error: any) => {
    const config = error?.config;
    if (
      !(isStudioUnauthorizedError(error) || failedWithoutResponse(error))
      || !isStudioUrl(config?.url, config?.baseURL)
      || config[RESENT]
      || (!isSigningIn && await hasStudioSession())
    ) {
      return Promise.reject(error);
    }
    // eslint-disable-next-line no-param-reassign
    error[STUDIO_SESSION_ERROR] = true;
    const result = new Promise((resolve, reject) => {
      held.push({
        isSave: isSave(config),
        send: () => {
          httpClient.request({ ...config, [RESENT]: true }).then(resolve, reject);
        },
        fail: () => reject(error),
      });
    });
    if (!isSigningIn && !isRedirecting && !isSignInPromptOpen) {
      restoreStudioSession();
    }
    return result;
  });
  return () => {
    httpClient.interceptors.request.eject(requestInterceptor);
    httpClient.interceptors.response.eject(responseInterceptor);
  };
};

/** The default number of retries React Query makes for a failed query. */
const DEFAULT_QUERY_RETRIES = 3;

/**
 * React Query `retry` option: the default, except that a query failed for lack of a Studio session
 * is not retried.
 *
 * Such a query fails only when the session could not be restored, so a retry can only fail again.
 */
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => (
  !isStudioSessionError(error) && failureCount < DEFAULT_QUERY_RETRIES
);

/** Only for tests: forget any sign-in, redirect, prompt or held request. */
export const resetStudioLoginRedirect = () => {
  clearTimeout(holdRequestsTimer);
  isSigningIn = false;
  isRedirecting = false;
  sessionCheck = null;
  isSignInPromptOpen = false;
  held = [];
};
