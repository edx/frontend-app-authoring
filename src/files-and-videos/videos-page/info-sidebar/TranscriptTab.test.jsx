import {
  render,
  act,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { initializeMockApp } from '@edx/frontend-platform';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { Provider } from 'react-redux';

import initializeStore from '../../../store';
import { RequestStatus } from '../../../data/constants';
import TranscriptTab from './TranscriptTab';
import {
  courseId,
  initialState,
} from '../factories/mockApiResponses';
import { ToastContext } from '../../../generic/toast-context';
import { useWaffleFlags } from '../../../data/apiHooks';
import { updateEditStatus } from '../data/slice';
import messages from './messages';
import VideosPageProvider from '../VideosPageProvider';

import TranscriptForm from './TranscriptForm';
import Transcript from './transcript-item';
import { TranscriptEditorModal } from '../transcript-editor';
import { uploadVideoTranscript } from '../data/thunks';

jest.mock('../../../data/apiHooks', () => ({
  useWaffleFlags: jest.fn(),
}));

jest.mock('./TranscriptForm', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('./transcript-item', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../transcript-editor', () => ({
  TranscriptEditorModal: jest.fn(() => null),
}));

jest.mock('../data/thunks', () => ({
  deleteVideoTranscript: jest.fn(() => () => Promise.resolve()),
  downloadVideoTranscript: jest.fn(() => () => Promise.resolve()),
  resetErrors: jest.fn(() => ({ type: 'videos/resetErrors' })),
  updateVideoTranscriptLanguage: jest.fn(() => ({ type: 'videos/updateTranscriptLanguage' })),
  uploadVideoTranscript: jest.fn(() => () => Promise.resolve()),
}));

const defaultProps = {
  id: 'mOckID0',
  displayName: 'mOckID0.mp4',
  wrapperType: 'video',
  dateAdded: '',
  thumbnail: '/video',
  fileSize: null,
  edx_video_id: 'mOckID0',
  clientVideoId: 'mOckID0.mp4',
  created: '',
  courseVideoImageUrl: '/video',
  transcripts: [],
  status: 'Imported',
  downloadLink: 'http://mOckID0.mp4',
};

const renderComponent = ({
  props = defaultProps,
  waffleFlags = { enableTranscriptEditor: false },
} = {}) => {
  useWaffleFlags.mockReturnValue({
    enableTranscriptEditor: false,
    ...waffleFlags,
  });
  const store = initializeStore(initialState);
  const showToast = jest.fn();
  render(
    <IntlProvider locale="en">
      <Provider store={store}>
        <ToastContext.Provider
          value={{
            toastMessage: null,
            toastAction: undefined,
            showToast,
            closeToast: jest.fn(),
          }}
        >
          <VideosPageProvider courseId={courseId}>
            <TranscriptTab video={props} />
          </VideosPageProvider>
        </ToastContext.Provider>
      </Provider>
    </IntlProvider>,
  );

  return { showToast, store };
};

describe('TranscriptTab', () => {
  beforeAll(() => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: false,
        roles: [],
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    TranscriptForm.mockImplementation(({ onCancel, onSubmit }) => (
      <div>
        <div>TranscriptForm</div>
        <button
          type="button"
          onClick={() => onSubmit({
            language: 'en',
            file: new File(['1\n00:00:00,000 --> 00:00:01,000\nHello'], 'captions.srt', { type: 'text/plain' }),
          })}
        >
          Submit new transcript
        </button>
        <button type="button" onClick={onCancel}>Cancel new transcript</button>
      </div>
    ));

    Transcript.mockImplementation(({ transcript, editEnabled, onEdit }) => (
      <div data-testid={`transcript-${transcript}`}>
        <span>{`transcript:${transcript}`}</span>
        <span>{`edit:${String(editEnabled)}`}</span>
        <button type="button" onClick={() => onEdit(transcript)}>Edit transcript</button>
      </div>
    ));

    TranscriptEditorModal.mockImplementation(({ languageName }) => (
      <div>{`TranscriptEditorModal:${languageName}`}</div>
    ));
  });

  it('shows the add transcript CTA when there are no transcripts', () => {
    renderComponent();

    expect(screen.getByText(messages.uploadButtonLabel.defaultMessage)).toBeInTheDocument();
    expect(screen.queryByText('TranscriptForm')).not.toBeInTheDocument();
  });

  it('switches to the new transcript form and back on cancel', () => {
    renderComponent();

    fireEvent.click(screen.getByText(messages.uploadButtonLabel.defaultMessage));
    expect(screen.getByText('TranscriptForm')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel new transcript'));

    expect(screen.queryByText('TranscriptForm')).not.toBeInTheDocument();
    expect(screen.getByText(messages.uploadButtonLabel.defaultMessage)).toBeInTheDocument();
  });

  it('passes editEnabled to transcript rows when the transcript editor flag is enabled', () => {
    renderComponent({
      props: {
        ...defaultProps,
        transcripts: ['ar'],
      },
      waffleFlags: { enableTranscriptEditor: true },
    });

    expect(screen.getByText('edit:true')).toBeInTheDocument();
  });

  it('opens the transcript editor modal when a transcript row requests edit', () => {
    renderComponent({
      props: {
        ...defaultProps,
        transcripts: ['ar'],
      },
      waffleFlags: { enableTranscriptEditor: true },
    });

    fireEvent.click(screen.getByText('Edit transcript'));

    expect(screen.getByText('TranscriptEditorModal:Arabic')).toBeInTheDocument();
  });

  it('shows an upload toast and exits add mode after a successful upload transition', async () => {
    const { showToast, store } = renderComponent();

    fireEvent.click(screen.getByText(messages.uploadButtonLabel.defaultMessage));
    fireEvent.click(screen.getByText('Submit new transcript'));

    expect(uploadVideoTranscript).toHaveBeenCalledWith(expect.objectContaining({
      videoId: defaultProps.id,
      language: '',
      newLanguage: 'en',
    }));

    act(() => {
      store.dispatch(updateEditStatus({
        editType: 'transcript',
        status: RequestStatus.IN_PROGRESS,
      }));
    });

    act(() => {
      store.dispatch(updateEditStatus({
        editType: 'transcript',
        status: RequestStatus.SUCCESSFUL,
      }));
    });

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(messages.transcriptUploadedToast.defaultMessage);
    });
    expect(screen.queryByText('TranscriptForm')).not.toBeInTheDocument();
    expect(screen.getByText(messages.uploadButtonLabel.defaultMessage)).toBeInTheDocument();
  });
});
