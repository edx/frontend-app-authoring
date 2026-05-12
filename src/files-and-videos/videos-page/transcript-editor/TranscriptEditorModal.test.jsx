import React from 'react';
import {
  render, screen, waitFor,
} from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import userEvent from '@testing-library/user-event';
import { fetchTranscriptText } from '../data/api';
import TranscriptEditorModal from './TranscriptEditorModal';

jest.mock('../data/api', () => ({
  fetchTranscriptText: jest.fn(),
  uploadTranscript: jest.fn(),
}));

const SRT_CONTENT = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:06,000
This is a test
`;

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  courseName: 'Test Course',
  videoId: 'video-123',
  videoFilename: 'lecture.mp4',
  videoSrc: '',
  language: 'en',
  languageName: 'English',
  transcriptDownloadHandlerUrl: '/xblock/transcripts/download',
  transcriptUploadHandlerUrl: '/xblock/transcripts/upload',
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <TranscriptEditorModal {...defaultProps} {...props} />
  </IntlProvider>,
);

describe('TranscriptEditorModal', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderComponent({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal dialog when isOpen is true', async () => {
    fetchTranscriptText.mockResolvedValueOnce('');
    renderComponent();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows course name and video filename in header', async () => {
    fetchTranscriptText.mockResolvedValueOnce('');
    renderComponent();
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('lecture.mp4')).toBeInTheDocument();
  });

  it('shows language name in header', async () => {
    fetchTranscriptText.mockResolvedValueOnce('');
    renderComponent();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('shows loading state while fetching transcript', async () => {
    fetchTranscriptText.mockReturnValueOnce(new Promise(() => {}));
    renderComponent();
    expect(screen.getAllByText('Loading transcript…').length).toBeGreaterThan(0);
  });

  it('shows error state when transcript fetch fails', async () => {
    fetchTranscriptText.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Failed to load transcript.')).toBeInTheDocument();
    });
  });

  it('renders cues after successful fetch', async () => {
    fetchTranscriptText.mockResolvedValueOnce(SRT_CONTENT);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument();
    });
  });

  it('renders second cue text', async () => {
    fetchTranscriptText.mockResolvedValueOnce(SRT_CONTENT);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByDisplayValue('This is a test')).toBeInTheDocument();
    });
  });

  it('shows "Add new cue" append button after cues load', async () => {
    fetchTranscriptText.mockResolvedValueOnce(SRT_CONTENT);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Add new cue')).toBeInTheDocument();
    });
  });

  it('shows "Video preview is not available." when videoSrc is empty', async () => {
    fetchTranscriptText.mockResolvedValueOnce('');
    renderComponent({ videoSrc: '' });
    expect(screen.getByText('Video preview is not available.')).toBeInTheDocument();
  });

  it('renders video element when videoSrc is provided', async () => {
    fetchTranscriptText.mockResolvedValueOnce('');
    renderComponent({ videoSrc: 'https://cdn.example.com/video.mp4' });
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    fetchTranscriptText.mockResolvedValueOnce('');
    renderComponent({ onClose });
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows editing a cue text', async () => {
    fetchTranscriptText.mockResolvedValueOnce(SRT_CONTENT);
    renderComponent();
    await waitFor(() => screen.getByDisplayValue('Hello world'));
    const textarea = screen.getByDisplayValue('Hello world');
    await user.clear(textarea);
    await user.type(textarea, 'Updated cue');
    expect(screen.getByDisplayValue('Updated cue')).toBeInTheDocument();
  });

  it('appends a new cue when "Add new cue" is clicked', async () => {
    fetchTranscriptText.mockResolvedValueOnce(SRT_CONTENT);
    renderComponent();
    await waitFor(() => screen.getByText('Add new cue'));
    const textareasBefore = screen.getAllByRole('textbox');
    await user.click(screen.getByText('Add new cue'));
    const textareasAfter = screen.getAllByRole('textbox');
    expect(textareasAfter.length).toBeGreaterThan(textareasBefore.length);
  });
});
