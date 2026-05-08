import React from 'react';
import {
  render, screen, initializeMocks, fireEvent,
} from '@src/testUtils';
import { thunkActions, selectors } from '../../../../../../data/redux';
import { validateSrtFile } from '../../../../../../../files-and-videos/videos-page/transcript-editor/srtUtils';

import * as componentModule from './TranscriptActionMenu';

const TranscriptActionMenu = componentModule.TranscriptActionMenuInternal;

jest.mock('react-redux', () => {
  const dispatchFn = jest.fn().mockName('mockUseDispatch');
  return {
    ...jest.requireActual('react-redux'),
    dispatch: dispatchFn,
    useDispatch: jest.fn(() => dispatchFn),
  };
});

jest.mock('../../../../../../data/redux', () => ({
  thunkActions: {
    video: {
      deleteTranscript: jest.fn().mockName('thunkActions.video.deleteTranscript'),
      replaceTranscript: jest.fn((args) => ({ replaceTranscript: args })).mockName('thunkActions.video.replaceTranscript'),
      downloadTranscript: jest.fn().mockName('thunkActions.video.downloadTranscript'),
    },
  },
  selectors: {
    video: {
      getTranscriptDownloadUrl: jest.fn(args => ({ getTranscriptDownloadUrl: args })).mockName('selectors.video.getTranscriptDownloadUrl'),
      buildTranscriptUrl: jest.fn(args => ({ buildTranscriptUrl: args })).mockName('selectors.video.buildTranscriptUrl'),
    },
  },
}));

jest.mock('../../../../../../sharedComponents/FileInput', () => ({
  FileInput: 'FileInput',
  fileInput: jest.fn((args) => ({ click: jest.fn().mockName('click input'), onAddFile: args.onAddFile })),
}));

jest.mock('../../../../../../../files-and-videos/videos-page/transcript-editor/srtUtils', () => ({
  validateSrtFile: jest.fn(),
}));

describe('TranscriptActionMenu', () => {
  const mockValidateSrtFile = validateSrtFile as jest.Mock;

  beforeEach(() => {
    mockValidateSrtFile.mockReset();
  });

  describe('hooks', () => {
    describe('replaceFileCallback', () => {
      const lang1Code = 'coDe';
      const mockFile = 'sOmeEbytes';
      const mockFileName = 'one.srt';
      const mockEvent = { mockFile, name: mockFileName };
      const mockDispatch = jest.fn();
      const result = { newFile: { mockFile, name: mockFileName }, newFilename: mockFileName, language: lang1Code };

      beforeEach(() => {
        mockDispatch.mockClear();
        (thunkActions.video.replaceTranscript as jest.Mock).mockClear();
      });

      test('it dispatches the correct thunk', () => {
        mockValidateSrtFile.mockImplementation((_file, callbacks) => callbacks.onValid(mockEvent));
        const cb = componentModule.hooks.replaceFileCallback({
          dispatch: mockDispatch,
          language: lang1Code,
          onEmptyFail: jest.fn(),
          onSizeFail: jest.fn(),
          onInvalidFail: jest.fn(),
        });
        cb(mockEvent);
        expect(thunkActions.video.replaceTranscript).toHaveBeenCalledWith(result);
        expect(mockDispatch).toHaveBeenCalledWith({ replaceTranscript: result });
      });

      test('it forwards validation failures without dispatching', () => {
        const onInvalidFail = jest.fn();
        mockValidateSrtFile.mockImplementation((_file, callbacks) => callbacks.onInvalidFail());

        const cb = componentModule.hooks.replaceFileCallback({
          dispatch: mockDispatch,
          language: lang1Code,
          onEmptyFail: jest.fn(),
          onSizeFail: jest.fn(),
          onInvalidFail,
        });

        cb(mockEvent);

        expect(onInvalidFail).toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });
  });

  describe('renders', () => {
    const props = {
      index: 1,
      language: 'lAnG',
      launchDeleteConfirmation: jest.fn().mockName('launchDeleteConfirmation'),
      // redux
      getTranscriptDownloadUrl: jest.fn().mockName('selectors.video.getTranscriptDownloadUrl'),
      buildTranscriptUrl: jest.fn().mockName('selectors.video.buildTranscriptUrl').mockImplementation((url) => url.transcriptUrl),
    };
    beforeEach(() => {
      initializeMocks();
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    test('renders as expected with default props', () => {
      render(<TranscriptActionMenu {...props} />);
      expect(screen.getByRole('button', { name: 'Actions dropdown' })).toBeInTheDocument();
    });

    test('snapshots: renders as expected with transcriptUrl props', () => {
      render(<TranscriptActionMenu {...props} transcriptUrl="url" />);
      const actionsDropdown = screen.getByRole('button', { name: 'Actions dropdown' });
      expect(actionsDropdown).toBeInTheDocument();
      fireEvent.click(actionsDropdown);
      const downloadOption = screen.getByRole('link', { name: 'Download' });
      expect(downloadOption).toBeInTheDocument();
      expect(downloadOption).toHaveAttribute('href', 'url');
    });
  });

  describe('mapStateToProps', () => {
    // type set to any to prevent warning on not matchig expected type on the selectors
    const testState: any = { A: 'pple', B: 'anana', C: 'ucumber' };
    test('getTranscriptDownloadUrl from video.getTranscriptDownloadUrl', () => {
      expect(
        componentModule.mapStateToProps(testState).getTranscriptDownloadUrl,
      ).toEqual(selectors.video.getTranscriptDownloadUrl(testState));
    });
  });
  describe('mapDispatchToProps', () => {
    test('deleteTranscript from thunkActions.video.deleteTranscript', () => {
      expect(componentModule.mapDispatchToProps.downloadTranscript).toEqual(thunkActions.video.downloadTranscript);
    });
  });
});
