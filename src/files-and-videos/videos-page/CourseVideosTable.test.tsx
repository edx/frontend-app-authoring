import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { AppProvider } from '@edx/frontend-platform/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { initializeMockApp } from '@edx/frontend-platform';
import { RequestStatus } from '@src/data/constants';
import { FileTable } from '@src/files-and-videos/generic';
import initializeStore from '@src/store';

import { CourseVideosTable } from './CourseVideosTable';

jest.mock('@src/files-and-videos/generic', () => ({
  FileTable: jest.fn(({ files, data }) => (
    <div data-testid="file-table">
      <span data-testid="file-type">{data?.fileType}</span>
      <span data-testid="file-count">{files?.length ?? 0}</span>
    </div>
  )),
  ActiveColumn: jest.fn(() => null),
  StatusColumn: jest.fn(() => null),
  ThumbnailColumn: jest.fn(() => null),
  TranscriptColumn: jest.fn(() => null),
}));

jest.mock('@src/files-and-videos/videos-page/transcript-settings', () => jest.fn(({ open }) => (
  open ? <div data-testid="transcript-settings" /> : null
)));
jest.mock('@src/files-and-videos/videos-page/upload-modal', () => jest.fn(() => null));
jest.mock('@src/files-and-videos/videos-page/VideoThumbnail', () => jest.fn(() => null));
jest.mock('@src/files-and-videos/videos-page/info-sidebar/InfoTab', () => jest.fn(({ video }) => (
  <div data-testid="info-tab">{video?.displayName}</div>
)));
jest.mock('@src/files-and-videos/videos-page/info-sidebar/TranscriptTab', () => jest.fn(({ video }) => (
  <div data-testid="transcript-tab">{video?.displayName}</div>
)));

const courseId = 'course-v1:TestX+Test101+2024';
const mockedFileTable = FileTable as unknown as jest.Mock;

const buildInitialState = (overrides = {}) => ({
  courseDetail: { courseId, status: RequestStatus.SUCCESSFUL, canChangeProviders: null },
  videos: {
    videoIds: [],
    pageSettings: {
      isVideoTranscriptEnabled: false,
      encodingsDownloadUrl: '',
      videoUploadMaxFileSize: 1,
      videoSupportedFileFormats: ['.mp4', '.mov'],
      videoImageSettings: {
        videoImageUploadEnabled: false,
        maxSize: 2097152,
        minSize: 2048,
        maxWidth: 1280,
        maxHeight: 720,
        supportedFileFormats: {},
      },
      videoTranscriptSettings: {
        transcriptDownloadHandlerUrl: '/transcript_download/',
        transcriptUploadHandlerUrl: '/transcript_upload/',
        transcriptDeleteHandlerUrl: '/transcript_delete/',
        transcriptionPlans: {},
      },
      transcriptAvailableLanguages: [],
      activeTranscriptPreferences: null,
      transcriptCredentials: {},
    },
    loadingStatus: RequestStatus.SUCCESSFUL,
    updatingStatus: '',
    addingStatus: RequestStatus.SUCCESSFUL,
    deletingStatus: '',
    usageStatus: '',
    transcriptStatus: '',
    errors: {
      add: [], delete: [], thumbnail: [], download: [], usageMetrics: [], transcript: [], loading: '',
    },
    defaultView: 'card',
    ...overrides,
  },
  models: { videos: {} },
});

const renderComponent = (stateOverrides = {}) => {
  const store = initializeStore(buildInitialState(stateOverrides));
  return render(
    <IntlProvider locale="en">
      <AppProvider store={store} wrapWithRouter={false}>
        <MemoryRouter initialEntries={[`/course/${courseId}/videos`]}>
          <Routes>
            <Route path="/course/:courseId/*" element={<CourseVideosTable />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </IntlProvider>,
  );
};

describe('CourseVideosTable', () => {
  beforeAll(() => initializeMockApp());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the FileTable with fileType "video"', () => {
    renderComponent();
    expect(screen.getByTestId('file-table')).toBeInTheDocument();
    expect(screen.getByTestId('file-type')).toHaveTextContent('video');
  });

  it('passes empty files when videoIds is empty', () => {
    renderComponent();
    expect(screen.getByTestId('file-count')).toHaveTextContent('0');
  });

  it('does not render FileTable when loadingStatus is FAILED', () => {
    renderComponent({ loadingStatus: RequestStatus.FAILED });
    expect(screen.queryByTestId('file-table')).not.toBeInTheDocument();
  });

  it('renders transcript settings button when isVideoTranscriptEnabled is true', () => {
    renderComponent({
      pageSettings: {
        isVideoTranscriptEnabled: true,
        encodingsDownloadUrl: '',
        videoUploadMaxFileSize: 1,
        videoSupportedFileFormats: [],
        videoImageSettings: {
          videoImageUploadEnabled: false,
          maxSize: 2097152,
          minSize: 2048,
          maxWidth: 1280,
          maxHeight: 720,
          supportedFileFormats: {},
        },
        videoTranscriptSettings: {
          transcriptDownloadHandlerUrl: '/download/',
          transcriptUploadHandlerUrl: '/upload/',
          transcriptDeleteHandlerUrl: '/delete/',
          transcriptionPlans: {},
        },
        transcriptAvailableLanguages: [],
        activeTranscriptPreferences: null,
        transcriptCredentials: {},
      },
    });
    expect(screen.getByText('Transcript settings')).toBeInTheDocument();
  });

  it('does not render transcript settings button when disabled', () => {
    renderComponent();
    expect(screen.queryByText('Transcript settings')).not.toBeInTheDocument();
  });

  it('renderInfoModalContent returns details with InfoTab and sidebar with TranscriptTab', () => {
    renderComponent();

    const capturedProps = mockedFileTable.mock.calls[0]?.[0];
    expect(capturedProps).toBeDefined();
    expect(typeof capturedProps.renderInfoModalContent).toBe('function');

    const mockVideo = { id: 'vid-1', displayName: 'lecture.mp4', transcripts: [] };
    const result = capturedProps.renderInfoModalContent(mockVideo);

    render(
      <IntlProvider locale="en">
        {result.details}
        {result.sidebar}
      </IntlProvider>,
    );

    expect(screen.getByTestId('info-tab')).toBeInTheDocument();
    expect(screen.getByTestId('transcript-tab')).toBeInTheDocument();
  });

  it('renderInfoModalContent returns both details and sidebar slots', () => {
    renderComponent();

    const capturedProps = mockedFileTable.mock.calls[0]?.[0];
    const mockVideo = { id: 'vid-1', displayName: 'lecture.mp4', transcripts: [] };
    const result = capturedProps.renderInfoModalContent(mockVideo);

    expect(result.details).toBeDefined();
    expect(result.sidebar).toBeDefined();
  });
});
