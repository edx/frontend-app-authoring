import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import InfoModal from './InfoModal';

const mockFile = {
  displayName: 'lecture.mp4',
  wrapperType: 'video',
  id: 'video-123',
  dateAdded: '2024-01-15T10:00:00Z',
  fileSize: 2097152,
  usageLocations: [],
  status: 'uploaded',
  transcriptionStatus: null,
};

const defaultProps = {
  file: mockFile,
  isOpen: true,
  onClose: jest.fn(),
  thumbnailPreview: jest.fn(() => <div data-testid="thumbnail-preview" />),
  usagePathStatus: 'successful',
  error: [],
  renderContent: null,
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <InfoModal {...defaultProps} {...props} />
  </IntlProvider>,
);

describe('InfoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with the file display name', () => {
    renderComponent();
    expect(screen.getAllByText('lecture.mp4').length).toBeGreaterThan(0);
  });

  it('renders without renderContent without crashing', () => {
    renderComponent({ renderContent: null });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders details from renderContent', () => {
    const renderContent = jest.fn(() => ({
      details: <div data-testid="custom-details">Video Details</div>,
      sidebar: null,
    }));
    renderComponent({ renderContent });
    expect(screen.getByTestId('custom-details')).toBeInTheDocument();
  });

  it('renders sidebar from renderContent', () => {
    const renderContent = jest.fn(() => ({
      details: null,
      sidebar: <div data-testid="custom-sidebar">Sidebar Content</div>,
    }));
    renderComponent({ renderContent });
    expect(screen.getByTestId('custom-sidebar')).toBeInTheDocument();
  });

  it('calls renderContent with the current file', () => {
    const renderContent = jest.fn(() => ({ details: null, sidebar: null }));
    renderComponent({ renderContent });
    expect(renderContent).toHaveBeenCalledWith(mockFile);
  });

  it('renders both details and sidebar from renderContent', () => {
    const renderContent = jest.fn(() => ({
      details: <span data-testid="det">details</span>,
      sidebar: <span data-testid="side">sidebar</span>,
    }));
    renderComponent({ renderContent });
    expect(screen.getByTestId('det')).toBeInTheDocument();
    expect(screen.getByTestId('side')).toBeInTheDocument();
  });

  it('does not show transcription error alert when transcriptionStatus is null', () => {
    renderComponent();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows transcription error alert when transcriptionStatus is a failure status', () => {
    const fileWithTranscriptError = {
      ...mockFile,
      transcriptionStatus: 'Transcript Failed',
      errorDescription: 'Upload error',
    };
    renderComponent({ file: fileWithTranscriptError });
    expect(screen.getByText(/Transcript failed/i)).toBeInTheDocument();
  });

  it('renders thumbnail preview component', () => {
    renderComponent();
    expect(screen.getByTestId('thumbnail-preview')).toBeInTheDocument();
  });

  it('renders "Usage" section', () => {
    renderComponent();
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderComponent({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
