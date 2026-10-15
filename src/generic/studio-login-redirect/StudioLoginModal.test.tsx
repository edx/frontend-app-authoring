import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import type MockAdapter from 'axios-mock-adapter';

import {
  act, fireEvent, initializeMocks, render, screen,
} from '@src/testUtils';
import { addStudioLoginRedirectInterceptor, resetStudioLoginRedirect } from '.';
import StudioLoginModal from './StudioLoginModal';
import messages from './messages';

const originalLocation = window.location;
const originalFetch = global.fetch;
const pageUrl = 'http://localhost/course/course-v1:org+101+run/course_info';

/** No Studio session, and the user is signed out of the LMS too, so signing in means leaving the page. */
const mockSignedOut = () => {
  global.fetch = jest.fn(async (_url: string, init?: RequestInit) => (
    init?.mode === 'no-cors' ? { type: 'opaque', status: 0 } : { type: 'opaqueredirect', status: 0 }
  )) as unknown as typeof fetch;
};

describe('<StudioLoginModal />', () => {
  let axiosMock: MockAdapter;
  let assign: jest.Mock;
  let removeInterceptors: () => void;
  const saveUrl = () => `${getConfig().STUDIO_BASE_URL}/course_info_update/course-v1:org+101+run/`;

  /**
   * A save that Studio refuses for lack of a session. It stays pending while the user is asked, so it
   * is returned in an object: an async function returning it would wait for it.
   */
  const failSave = async () => {
    axiosMock.onPost(saveUrl()).reply(401);
    let request: Promise<unknown> = Promise.resolve();
    await act(async () => {
      request = getAuthenticatedHttpClient().post(saveUrl());
      request.catch(() => undefined);
      await new Promise((resolve) => { setTimeout(resolve, 0); });
    });
    return { request };
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
    mockSignedOut();
    removeInterceptors = addStudioLoginRedirectInterceptor();
  });

  afterEach(() => {
    removeInterceptors();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('is closed until a request fails for lack of a Studio session', async () => {
    render(<StudioLoginModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await failSave();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(messages.title.defaultMessage)).toBeInTheDocument();
  });

  it('takes the user to the Studio login and back to this page', async () => {
    render(<StudioLoginModal />);
    await failSave();

    fireEvent.click(screen.getByRole('button', { name: messages.signInButton.defaultMessage }));

    expect(assign).toHaveBeenCalledTimes(1);
    const loginUrl = new URL(assign.mock.calls[0][0]);
    expect(loginUrl.pathname).toEqual('/login/');
    expect(loginUrl.searchParams.get('next')).toEqual(pageUrl);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the user on the page when they cancel, and only then fails the save', async () => {
    render(<StudioLoginModal />);
    const { request } = await failSave();

    fireEvent.click(screen.getByRole('button', { name: messages.cancelButton.defaultMessage }));

    expect(assign).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(request).rejects.toMatchObject({ response: { status: 401 } });
  });
});
