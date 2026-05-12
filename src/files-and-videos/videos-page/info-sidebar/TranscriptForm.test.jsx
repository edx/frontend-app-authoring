import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import userEvent from '@testing-library/user-event';
import { validateSrtFile } from '../transcript-editor/srtUtils';
import TranscriptForm from './TranscriptForm';

jest.mock('../transcript-editor/srtUtils', () => ({
  validateSrtFile: jest.fn(),
}));

jest.mock('../../generic/FileInput', () => {
  const MockFileInput = jest.fn(() => null);
  const useFileInput = jest.fn((opts) => ({
    click: jest.fn(() => {
      const file = new File(['1\n00:00:01,000 --> 00:00:02,000\nHello\n'], 'test.srt', { type: 'text/plain' });
      opts.onAddFile([file]);
    }),
  }));
  return { __esModule: true, default: MockFileInput, useFileInput };
});

const defaultProps = {
  languages: { en: 'English', fr: 'French', es: 'Spanish' },
  previousSelection: [],
  onCancel: jest.fn(),
  onSubmit: jest.fn(),
  onFileTooLarge: jest.fn(),
  isUploading: false,
  uploadFailed: false,
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <TranscriptForm {...defaultProps} {...props} />
  </IntlProvider>,
);

describe('TranscriptForm', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it('renders the form heading', () => {
    renderComponent();
    expect(screen.getByText('New transcript')).toBeInTheDocument();
  });

  it('renders language selector with placeholder', () => {
    renderComponent();
    expect(screen.getByText('Select language')).toBeInTheDocument();
  });

  it('renders the Upload file button initially', () => {
    renderComponent();
    expect(screen.getByText('Upload file')).toBeInTheDocument();
  });

  it('renders Cancel and Add transcript buttons', () => {
    renderComponent();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Add transcript')).toBeInTheDocument();
  });

  it('Add transcript button is disabled when no language and no file selected', () => {
    renderComponent();
    expect(screen.getByText('Add transcript').closest('button')).toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = jest.fn();
    renderComponent({ onCancel });
    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows upload spinner and filename while uploading', () => {
    renderComponent({ isUploading: true });
    expect(document.querySelector('.new-transcript-form__spinner')).toBeInTheDocument();
  });

  it('shows upload failed error when uploadFailed is true', () => {
    renderComponent({ uploadFailed: true });
    expect(screen.getByText('Upload failed, please try again')).toBeInTheDocument();
  });

  it('calls validateSrtFile when a file is picked', async () => {
    validateSrtFile.mockImplementationOnce((f, cbs) => cbs.onValid(f));
    renderComponent();
    await user.click(screen.getByText('Upload file'));
    expect(validateSrtFile).toHaveBeenCalledTimes(1);
  });

  it('shows invalid file error when validateSrtFile calls onInvalidFail', async () => {
    validateSrtFile.mockImplementationOnce((f, cbs) => cbs.onInvalidFail());
    renderComponent();
    await user.click(screen.getByText('Upload file'));
    expect(screen.getByText('Invalid subtitle file')).toBeInTheDocument();
  });

  it('treats an empty file as valid and lets the user submit it', async () => {
    const onSubmit = jest.fn();
    const emptyFile = new File([], 'empty.srt', { type: 'text/plain' });
    validateSrtFile.mockImplementationOnce((_f, cbs) => cbs.onValid(emptyFile));
    renderComponent({ onSubmit });
    await user.click(screen.getByText('Upload file'));
    expect(screen.getByText('empty.srt')).toBeInTheDocument();
    expect(screen.queryByText('File is empty, please select a valid SRT file')).not.toBeInTheDocument();
  });

  it('calls onFileTooLarge when validateSrtFile calls onSizeFail', async () => {
    const onFileTooLarge = jest.fn();
    validateSrtFile.mockImplementationOnce((f, cbs) => cbs.onSizeFail());
    renderComponent({ onFileTooLarge });
    await user.click(screen.getByText('Upload file'));
    expect(onFileTooLarge).toHaveBeenCalledTimes(1);
  });

  it('shows file name row after a valid file is selected', async () => {
    validateSrtFile.mockImplementationOnce((f, cbs) => cbs.onValid(f));
    renderComponent();
    await user.click(screen.getByText('Upload file'));
    expect(screen.getByText('test.srt')).toBeInTheDocument();
  });

  it('calls onSubmit with language and file when Add transcript is clicked', async () => {
    const onSubmit = jest.fn();
    validateSrtFile.mockImplementation((f, cbs) => cbs.onValid(f));
    renderComponent({ onSubmit });

    await user.click(screen.getByText('Upload file'));

    const langSelect = screen.getByText('Select language');
    await user.click(langSelect);
    await user.click(screen.getByText('English'));

    await user.click(screen.getByText('Add transcript'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en', file: expect.any(File) }),
    );
  });
});
