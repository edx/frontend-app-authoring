import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { initializeMockApp } from '@edx/frontend-platform';
import { AppProvider } from '@edx/frontend-platform/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequestStatus } from '@src/data/constants';
import { FileTable } from '@src/files-and-videos/generic';
import initializeStore from '@src/store';
import { CourseFilesTable } from './CourseFilesTable';

jest.mock('@src/files-and-videos/generic', () => ({
  AccessColumn: jest.fn(() => null),
  ActiveColumn: jest.fn(() => null),
  FileTable: jest.fn(({ files, data }) => (
    <div data-testid="file-table">
      <span data-testid="file-type">{data?.fileType}</span>
      <span data-testid="file-count">{files?.length ?? 0}</span>
    </div>
  )),
  ThumbnailColumn: jest.fn(() => null),
}));

jest.mock('@src/files-and-videos/files-page/FileThumbnail', () => jest.fn(() => null));
jest.mock('@src/files-and-videos/files-page/FileValidationModal', () => jest.fn(() => null));
jest.mock('@src/files-and-videos/files-page/FileInfoModalSidebar', () => jest.fn(({ asset }) => (
  <div data-testid="file-info-modal-sidebar">{asset?.displayName}</div>
)));

const courseId = 'course-v1:edX+DemoX+Demo_Course';
const mockedFileTable = FileTable as unknown as jest.Mock;

const buildInitialState = (assetOverrides = {}) => ({
  courseDetail: { courseId, status: RequestStatus.SUCCESSFUL, canChangeProviders: null },
  assets: {
    assetIds: [],
    loadingStatus: RequestStatus.SUCCESSFUL,
    updatingStatus: '',
    deletingStatus: '',
    addingStatus: '',
    usageStatus: '',
    errors: {
      add: [], delete: [], lock: [], download: [], usageMetrics: [], loading: '',
    },
    duplicateFiles: {},
    ...assetOverrides,
  },
  models: { assets: {} },
  videos: {
    videoIds: [],
    pageSettings: {},
    loadingStatus: RequestStatus.SUCCESSFUL,
    updatingStatus: '',
    addingStatus: '',
    deletingStatus: '',
    usageStatus: '',
    transcriptStatus: '',
    errors: {
      add: [], delete: [], thumbnail: [], download: [], usageMetrics: [], transcript: [], loading: '',
    },
    defaultView: 'card',
  },
});

const renderComponent = (assetOverrides = {}) => {
  const store = initializeStore(buildInitialState(assetOverrides));
  return render(
    <IntlProvider locale="en">
      <AppProvider store={store} wrapWithRouter={false}>
        <MemoryRouter initialEntries={[`/course/${courseId}/assets`]}>
          <Routes>
            <Route path="/course/:courseId/*" element={<CourseFilesTable />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </IntlProvider>,
  );
};

describe('CourseFilesTable', () => {
  beforeAll(() => initializeMockApp());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the FileTable with fileType "file"', () => {
    renderComponent();
    expect(screen.getByTestId('file-table')).toBeInTheDocument();
    expect(screen.getByTestId('file-type')).toHaveTextContent('file');
  });

  it('passes empty files when assetIds is empty', () => {
    renderComponent();
    expect(screen.getByTestId('file-count')).toHaveTextContent('0');
  });

  it('passes one file when assetIds has one entry', () => {
    renderComponent({
      assetIds: ['asset-1'],
    });
    expect(screen.getByTestId('file-table')).toBeInTheDocument();
  });

  it('renders FileInfoModalSidebar via renderInfoModalContent for a given asset', () => {
    renderComponent();

    const capturedProps = mockedFileTable.mock.calls[0]?.[0];
    expect(capturedProps).toBeDefined();
    expect(typeof capturedProps.renderInfoModalContent).toBe('function');

    const mockAsset = { id: 'asset-1', displayName: 'test.pdf', locked: false };
    const result = capturedProps.renderInfoModalContent(mockAsset);

    render(
      <IntlProvider locale="en">
        {result.sidebar}
      </IntlProvider>,
    );

    expect(screen.getByTestId('file-info-modal-sidebar')).toBeInTheDocument();
  });

  it('renderInfoModalContent returns no details slot', () => {
    renderComponent();

    const capturedProps = mockedFileTable.mock.calls[0]?.[0];
    const mockAsset = { id: 'asset-1', displayName: 'test.pdf', locked: false };
    const result = capturedProps.renderInfoModalContent(mockAsset);

    expect(result.details).toBeUndefined();
    expect(result.sidebar).toBeDefined();
  });
});
