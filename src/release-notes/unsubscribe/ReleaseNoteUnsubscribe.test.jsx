import React from 'react';
import {
  render, screen, fireEvent, initializeMocks, waitFor,
} from '../../testUtils';

import ReleaseNoteUnsubscribe from './ReleaseNoteUnsubscribe';
import messages from './messages';
import * as api from '../data/api';

const renderWithToken = (token) => {
  const initialEntries = token === undefined
    ? ['/release-notes/unsubscribe']
    : [`/release-notes/unsubscribe?token=${encodeURIComponent(token)}`];
  return render(<ReleaseNoteUnsubscribe />, {
    routerProps: { initialEntries },
  });
};

describe('ReleaseNoteUnsubscribe', () => {
  beforeEach(() => {
    initializeMocks();
  });

  test('shows error alert when no token is present', () => {
    renderWithToken(undefined);
    expect(screen.getByText(messages.unsubscribeError.defaultMessage)).toBeInTheDocument();
    // The confirmation CTA should not be rendered without a token
    expect(
      screen.queryByRole('button', { name: messages.unsubscribeButton.defaultMessage }),
    ).not.toBeInTheDocument();
  });

  test('renders the idle confirmation state when a token is present', () => {
    renderWithToken('valid-token');
    expect(screen.getByText(messages.unsubscribeTitle.defaultMessage)).toBeInTheDocument();
    expect(screen.getByText(messages.unsubscribeConfirmation.defaultMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.unsubscribeButton.defaultMessage }),
    ).toBeInTheDocument();
  });

  test('calls unsubscribeWithToken and shows success state on success', async () => {
    const spy = jest.spyOn(api, 'unsubscribeWithToken').mockResolvedValue({ resultStatus: 'unsubscribed' });
    renderWithToken('valid-token');

    fireEvent.click(screen.getByRole('button', { name: messages.unsubscribeButton.defaultMessage }));

    await waitFor(() => {
      expect(screen.getByText(messages.unsubscribeSuccessTitle.defaultMessage)).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith('valid-token');
  });

  test('shows error state and allows retry on failure', async () => {
    const spy = jest.spyOn(api, 'unsubscribeWithToken').mockRejectedValue(new Error('boom'));
    renderWithToken('valid-token');

    fireEvent.click(screen.getByRole('button', { name: messages.unsubscribeButton.defaultMessage }));

    await waitFor(() => {
      expect(screen.getByText(messages.unsubscribeErrorTitle.defaultMessage)).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // Retry button should re-trigger the request
    spy.mockResolvedValueOnce({ resultStatus: 'unsubscribed' });
    fireEvent.click(screen.getByRole('button', { name: messages.unsubscribeRetry.defaultMessage }));

    await waitFor(() => {
      expect(screen.getByText(messages.unsubscribeSuccessTitle.defaultMessage)).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
