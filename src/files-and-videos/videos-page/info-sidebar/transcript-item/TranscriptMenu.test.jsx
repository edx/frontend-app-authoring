import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import { TranscriptActionMenu } from './TranscriptMenu';

const defaultProps = {
  language: 'en',
  handleTranscript: jest.fn(),
  launchDeleteConfirmation: jest.fn(),
  input: { click: jest.fn() },
  editEnabled: false,
  onEdit: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <TranscriptActionMenu {...defaultProps} {...props} />
  </IntlProvider>,
);

describe('TranscriptActionMenu', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it('renders the dropdown toggle with correct test id', () => {
    renderComponent();
    expect(screen.getByTestId('en-transcript-menu')).toBeInTheDocument();
  });

  it('does not show Edit item when editEnabled is false', async () => {
    renderComponent({ editEnabled: false });
    await user.click(screen.getByTestId('en-transcript-menu'));
    expect(screen.queryByTestId('en-transcript-edit')).not.toBeInTheDocument();
  });

  it('shows Edit item when editEnabled is true', async () => {
    renderComponent({ editEnabled: true });
    await user.click(screen.getByTestId('en-transcript-menu'));
    expect(screen.getByTestId('en-transcript-edit')).toBeInTheDocument();
  });

  it('calls onEdit with language when Edit item clicked', async () => {
    const onEdit = jest.fn();
    renderComponent({ editEnabled: true, onEdit });
    await user.click(screen.getByTestId('en-transcript-menu'));
    await user.click(screen.getByTestId('en-transcript-edit'));
    expect(onEdit).toHaveBeenCalledWith('en');
  });

  it('calls input.click when Replace item clicked', async () => {
    const inputClick = jest.fn();
    renderComponent({ input: { click: inputClick } });
    await user.click(screen.getByTestId('en-transcript-menu'));
    await user.click(screen.getByText('Replace'));
    expect(inputClick).toHaveBeenCalledTimes(1);
  });

  it('calls handleTranscript with download action when Download item clicked', async () => {
    const handleTranscript = jest.fn();
    renderComponent({ handleTranscript });
    await user.click(screen.getByTestId('en-transcript-menu'));
    await user.click(screen.getByText('Download'));
    expect(handleTranscript).toHaveBeenCalledWith({ language: 'en' }, 'download');
  });

  it('calls launchDeleteConfirmation when Delete item clicked', async () => {
    const launchDeleteConfirmation = jest.fn();
    renderComponent({ launchDeleteConfirmation });
    await user.click(screen.getByTestId('en-transcript-menu'));
    await user.click(screen.getByText('Delete'));
    expect(launchDeleteConfirmation).toHaveBeenCalledTimes(1);
  });

  it('uses language prop in toggle id and test id', () => {
    renderComponent({ language: 'fr' });
    expect(screen.getByTestId('fr-transcript-menu')).toBeInTheDocument();
  });
});
