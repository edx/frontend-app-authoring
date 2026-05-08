import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import Transcript from './Transcript';
import { validateSrtFile } from '../../transcript-editor/srtUtils';

jest.mock('../../transcript-editor/srtUtils', () => ({
  validateSrtFile: jest.fn(),
}));

const mockValidateSrtFile = validateSrtFile;

const defaultLanguages = { ar: 'Arabic', en: 'English', fr: 'French' };

const defaultProps = {
  languages: defaultLanguages,
  transcript: 'en',
  previousSelection: [],
  handleTranscript: jest.fn(),
  editEnabled: false,
  onEdit: jest.fn(),
  onEmptyFile: jest.fn(),
  onSizeFail: jest.fn(),
  onInvalidFile: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <Transcript {...defaultProps} {...props} />
  </IntlProvider>,
);

describe('Transcript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the language select with the current transcript language', () => {
    renderComponent();
    expect(screen.getByTestId('transcript-en')).toBeInTheDocument();
  });

  it('shows the action menu (TranscriptMenu) for non-empty transcripts', () => {
    renderComponent();
    expect(screen.getByTestId('en-transcript-menu')).toBeInTheDocument();
  });

  it('shows delete icon button instead of menu for empty transcript', () => {
    renderComponent({ transcript: '' });
    expect(screen.queryByTestId('en-transcript-menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'delete empty transcript' })).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete icon clicked', () => {
    renderComponent({ transcript: '' });
    fireEvent.click(screen.getByRole('button', { name: 'delete empty transcript' }));
    expect(screen.getByText('Delete this transcript?')).toBeInTheDocument();
  });

  it('closes delete confirmation on cancel', () => {
    renderComponent({ transcript: '' });
    fireEvent.click(screen.getByRole('button', { name: 'delete empty transcript' }));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete this transcript?')).not.toBeInTheDocument();
  });

  it('calls handleTranscript with delete action on confirm', async () => {
    const user = userEvent.setup();
    const handleTranscript = jest.fn();
    renderComponent({ handleTranscript, transcript: 'en' });
    await user.click(screen.getByTestId('en-transcript-menu'));
    await user.click(screen.getByText('Delete'));
    await waitFor(() => {
      expect(screen.getByText('Delete this transcript?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Delete', { selector: 'button' }));
    expect(handleTranscript).toHaveBeenCalledWith({ language: 'en' }, 'delete');
  });

  it('calls validateSrtFile when a file is added via the input', () => {
    mockValidateSrtFile.mockImplementation(() => {});
    renderComponent();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    const testFile = new File(['content'], 'test.srt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    expect(mockValidateSrtFile).toHaveBeenCalledWith(
      testFile,
      expect.objectContaining({
        onEmptyFail: expect.any(Function),
        onSizeFail: expect.any(Function),
        onInvalidFail: expect.any(Function),
        onValid: expect.any(Function),
      }),
    );
  });

  it('calls onEmptyFile callback when validateSrtFile triggers onEmptyFail', () => {
    const onEmptyFile = jest.fn();
    mockValidateSrtFile.mockImplementation((_f, cbs) => cbs.onEmptyFail());
    renderComponent({ onEmptyFile });
    const fileInput = document.querySelector('input[type="file"]');
    const testFile = new File([''], 'test.srt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    expect(onEmptyFile).toHaveBeenCalled();
  });

  it('calls onSizeFail callback when validateSrtFile triggers onSizeFail', () => {
    const onSizeFail = jest.fn();
    mockValidateSrtFile.mockImplementation((_f, cbs) => cbs.onSizeFail());
    renderComponent({ onSizeFail });
    const fileInput = document.querySelector('input[type="file"]');
    const testFile = new File(['x'.repeat(100)], 'test.srt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    expect(onSizeFail).toHaveBeenCalled();
  });

  it('calls onInvalidFile callback when validateSrtFile triggers onInvalidFail', () => {
    const onInvalidFile = jest.fn();
    mockValidateSrtFile.mockImplementation((_f, cbs) => cbs.onInvalidFail());
    renderComponent({ onInvalidFile });
    const fileInput = document.querySelector('input[type="file"]');
    const testFile = new File(['not-srt'], 'test.srt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    expect(onInvalidFile).toHaveBeenCalled();
  });

  it('calls handleTranscript upload when file is valid', () => {
    const handleTranscript = jest.fn();
    const testFile = new File(['valid'], 'en.srt', { type: 'text/plain' });
    mockValidateSrtFile.mockImplementation((_f, cbs) => cbs.onValid(testFile));
    renderComponent({ handleTranscript });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    expect(handleTranscript).toHaveBeenCalledWith(
      expect.objectContaining({ file: testFile, language: 'en', newLanguage: 'en' }),
      'upload',
    );
  });

  it('passes editEnabled and onEdit to TranscriptMenu', () => {
    const onEdit = jest.fn();
    renderComponent({ editEnabled: true, onEdit });
    fireEvent.click(screen.getByTestId('en-transcript-menu'));
    expect(screen.getByTestId('en-transcript-edit')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('en-transcript-edit'));
    expect(onEdit).toHaveBeenCalledWith('en');
  });
});
