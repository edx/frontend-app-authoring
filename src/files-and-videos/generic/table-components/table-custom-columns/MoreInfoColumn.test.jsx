import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import userEvent from '@testing-library/user-event';

import MoreInfoColumn from './MoreInfoColumn';

Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

const baseRow = {
  original: {
    id: 'asset-abc',
    displayName: 'lecture.mp4',
    downloadLink: '/downloads/lecture.mp4',
    externalUrl: 'https://cdn.example.com/lecture.mp4',
    portableUrl: '/static/lecture.mp4',
    locked: false,
  },
};

const baseProps = {
  row: baseRow,
  handleLock: jest.fn(),
  handleBulkDownload: jest.fn(),
  handleOpenFileInfo: jest.fn(),
  handleOpenDeleteConfirmation: jest.fn(),
  fileType: 'file',
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <MoreInfoColumn {...baseProps} {...props} />
  </IntlProvider>,
);

describe('MoreInfoColumn', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it('renders the toggle icon button', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: 'More info icon button' })).toBeInTheDocument();
  });

  it('opens menu on toggle click', async () => {
    renderComponent();
    await user.click(screen.getByRole('button', { name: 'More info icon button' }));
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  describe('file type', () => {
    it('shows Copy Studio Url for file type', async () => {
      renderComponent({ fileType: 'file' });
      await user.click(screen.getByRole('button', { name: 'More info icon button' }));
      expect(screen.getByText('Copy Studio Url')).toBeInTheDocument();
    });

    it('shows Lock option for unlocked file', async () => {
      renderComponent({ fileType: 'file', row: { original: { ...baseRow.original, locked: false } } });
      await user.click(screen.getByRole('button', { name: 'More info icon button' }));
      expect(screen.getByText('Lock')).toBeInTheDocument();
    });

    it('shows Unlock option for locked file', async () => {
      renderComponent({ fileType: 'file', row: { original: { ...baseRow.original, locked: true } } });
      await user.click(screen.getByRole('button', { name: 'More info icon button' }));
      expect(screen.getByText('Unlock')).toBeInTheDocument();
    });

    it('shows Info label for file type', async () => {
      renderComponent({ fileType: 'file' });
      await user.click(screen.getByRole('button', { name: 'More info icon button' }));
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('video type', () => {
    it('shows Copy video ID for video type', async () => {
      renderComponent({ fileType: 'video' });
      await user.click(screen.getByRole('button', { name: 'More info icon button' }));
      expect(screen.getByText('Copy video ID')).toBeInTheDocument();
    });

    it('does not show Copy Studio Url for video type', async () => {
      renderComponent({ fileType: 'video' });
      await user.click(screen.getByRole('button', { name: 'More info icon button' }));
      expect(screen.queryByText('Copy Studio Url')).not.toBeInTheDocument();
    });

    it('shows Info and transcript(s) for video type', async () => {
      renderComponent({ fileType: 'video' });
      await user.click(screen.getByRole('button', { name: 'More info icon button' }));
      expect(screen.getByText('Info and transcript(s)')).toBeInTheDocument();
    });
  });

  it('calls handleOpenFileInfo when Info is clicked', async () => {
    const handleOpenFileInfo = jest.fn();
    renderComponent({ handleOpenFileInfo });
    await user.click(screen.getByRole('button', { name: 'More info icon button' }));
    await user.click(screen.getByText('Info'));
    expect(handleOpenFileInfo).toHaveBeenCalledWith(baseRow.original);
  });

  it('calls handleBulkDownload when Download is clicked', async () => {
    const handleBulkDownload = jest.fn();
    renderComponent({ handleBulkDownload });
    await user.click(screen.getByRole('button', { name: 'More info icon button' }));
    await user.click(screen.getByText('Download'));
    expect(handleBulkDownload).toHaveBeenCalledTimes(1);
  });

  it('calls handleOpenDeleteConfirmation when Delete is clicked', async () => {
    const handleOpenDeleteConfirmation = jest.fn();
    renderComponent({ handleOpenDeleteConfirmation });
    await user.click(screen.getByRole('button', { name: 'More info icon button' }));
    await user.click(screen.getByTestId('open-delete-confirmation-button'));
    expect(handleOpenDeleteConfirmation).toHaveBeenCalledTimes(1);
  });
});
