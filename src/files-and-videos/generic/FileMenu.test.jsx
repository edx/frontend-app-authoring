import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import FileMenu from './FileMenu';

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

const baseProps = {
  id: 'asset-123',
  onDownload: jest.fn(),
  openAssetInfo: jest.fn(),
  openDeleteConfirmation: jest.fn(),
  fileType: 'file',
  externalUrl: 'https://example.com/asset',
  portableUrl: '/static/asset',
  handleLock: jest.fn(),
  locked: false,
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <FileMenu {...baseProps} {...props} />
  </IntlProvider>,
);

describe('FileMenu', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('file type', () => {
    it('shows "Info" label for file type', async () => {
      renderComponent({ fileType: 'file' });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('shows copy studio URL option for file type', async () => {
      renderComponent({ fileType: 'file' });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.getByText('Copy Studio Url')).toBeInTheDocument();
    });

    it('shows lock/unlock option for file type', async () => {
      renderComponent({ fileType: 'file', locked: false });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.getByText('Lock')).toBeInTheDocument();
    });

    it('shows unlock label when file is locked', async () => {
      renderComponent({ fileType: 'file', locked: true });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.getByText('Unlock')).toBeInTheDocument();
    });
  });

  describe('video type', () => {
    it('shows "Info and transcript(s)" label for video type', async () => {
      renderComponent({ fileType: 'video' });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.getByText('Info and transcript(s)')).toBeInTheDocument();
    });

    it('does not show "Info" label for video type', async () => {
      renderComponent({ fileType: 'video' });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.queryByText('Info')).not.toBeInTheDocument();
    });

    it('shows copy video ID option for video type', async () => {
      renderComponent({ fileType: 'video' });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.getByText('Copy video ID')).toBeInTheDocument();
    });

    it('does not show copy studio URL for video type', async () => {
      renderComponent({ fileType: 'video' });
      await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
      expect(screen.queryByText('Copy Studio URL')).not.toBeInTheDocument();
    });
  });

  it('calls openAssetInfo when info item is clicked', async () => {
    const openAssetInfo = jest.fn();
    renderComponent({ openAssetInfo });
    await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
    await user.click(screen.getByText('Info'));
    expect(openAssetInfo).toHaveBeenCalledTimes(1);
  });

  it('calls openDeleteConfirmation when delete item is clicked', async () => {
    const openDeleteConfirmation = jest.fn();
    renderComponent({ openDeleteConfirmation });
    await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
    await user.click(screen.getByTestId('open-delete-confirmation-button'));
    expect(openDeleteConfirmation).toHaveBeenCalledTimes(1);
  });

  it('calls onDownload when download item is clicked', async () => {
    const onDownload = jest.fn();
    renderComponent({ onDownload });
    await user.click(screen.getByRole('button', { name: 'file-menu-toggle' }));
    await user.click(screen.getByText('Download'));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});
