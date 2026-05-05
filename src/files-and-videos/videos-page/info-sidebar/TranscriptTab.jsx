import React, {
  useEffect, useState, useRef, useContext,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import { Button, Stack } from '@openedx/paragon';
import { Add } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import ErrorAlert from '../../../editors/sharedComponents/ErrorAlerts/ErrorAlert';
import { ToastContext } from '../../../generic/toast-context';
import { useWaffleFlags } from '../../../data/apiHooks';
import { VideosPageContext } from '../VideosPageProvider';
import { TranscriptEditorModal } from '../transcript-editor';
import { getLanguages, getSortedTranscripts } from '../data/utils';
import Transcript from './transcript-item';
import TranscriptForm from './TranscriptForm';
import {
  deleteVideoTranscript,
  downloadVideoTranscript,
  resetErrors,
  uploadVideoTranscript,
} from '../data/thunks';
import { RequestStatus } from '../../../data/constants';
import messages from './messages';

const TranscriptTab = ({
  video,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const divRef = useRef(null);
  const { showToast } = useContext(ToastContext);
  const { courseId } = useContext(VideosPageContext);
  const waffleFlags = useWaffleFlags(courseId);
  const transcriptEditorEnabled = Boolean(waffleFlags?.transcriptEditor);
  const [editorLanguage, setEditorLanguage] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const prevTranscriptStatusRef = useRef(null);
  const lastActionRef = useRef(null);
  const { transcriptStatus, errors } = useSelector(state => state.videos);
  const {
    transcriptAvailableLanguages,
    videoTranscriptSettings,
  } = useSelector(state => state.videos.pageSettings);
  const {
    transcriptDeleteHandlerUrl,
    transcriptUploadHandlerUrl,
    transcriptDownloadHandlerUrl,
  } = videoTranscriptSettings;
  const { transcripts, id, displayName } = video;
  const languages = getLanguages(transcriptAvailableLanguages);
  let sortedTranscripts = getSortedTranscripts(languages, transcripts);
  const [previousSelection, setPreviousSelection] = useState(sortedTranscripts);

  useEffect(() => {
    dispatch(resetErrors({ errorType: 'transcript' }));
    sortedTranscripts = getSortedTranscripts(languages, transcripts);
    setPreviousSelection(sortedTranscripts);
  }, [transcripts]);

  useEffect(() => {
    if (
      prevTranscriptStatusRef.current === RequestStatus.IN_PROGRESS
      && transcriptStatus === RequestStatus.SUCCESSFUL
    ) {
      if (lastActionRef.current === 'delete') {
        showToast(intl.formatMessage(messages.transcriptDeletedToast));
      } else {
        showToast(intl.formatMessage(messages.transcriptUploadedToast));
        setIsAddingNew(false);
      }
      lastActionRef.current = null;
    }
    prevTranscriptStatusRef.current = transcriptStatus;
  }, [transcriptStatus, showToast, intl]);

  const handleAddEmptyTranscript = () => {
    setIsAddingNew(true);
  };

  const handleTranscript = (data, actionType) => {
    const {
      language,
      newLanguage,
      file,
    } = data;
    dispatch(resetErrors({ errorType: 'transcript' }));
    switch (actionType) {
      case 'delete':
        if (isEmpty(language)) {
          const updatedSelection = previousSelection;
          updatedSelection.shift();
          setPreviousSelection(updatedSelection);
        } else {
          lastActionRef.current = 'delete';
          dispatch(deleteVideoTranscript({
            language,
            videoId: id,
            apiUrl: transcriptDeleteHandlerUrl,
            transcripts,
          }));
        }
        break;
      case 'download':
        dispatch(downloadVideoTranscript({
          filename: `${displayName}-${language}.srt`,
          language,
          videoId: id,
          apiUrl: transcriptDownloadHandlerUrl,
        }));
        break;
      case 'upload':
        lastActionRef.current = 'upload';
        dispatch(uploadVideoTranscript({
          language,
          videoId: id,
          apiUrl: transcriptUploadHandlerUrl,
          newLanguage,
          file,
          transcripts,
        }));
        break;
      default:
        break;
    }
  };

  const handleNewTranscriptSubmit = ({ language, file }) => {
    handleTranscript({
      file,
      language: '',
      newLanguage: language,
    }, 'upload');
  };

  return (
    <Stack gap={3}>
      {isAddingNew ? (
        <TranscriptForm
          languages={languages}
          previousSelection={previousSelection}
          onCancel={() => setIsAddingNew(false)}
          onSubmit={handleNewTranscriptSubmit}
          onFileTooLarge={() => showToast(intl.formatMessage(messages.transcriptFileTooLarge))}
          isUploading={transcriptStatus === RequestStatus.IN_PROGRESS}
          uploadFailed={lastActionRef.current === 'upload' && transcriptStatus === RequestStatus.FAILED}
        />
      ) : (
        <>
          <h4 className="video-info-sidebar__heading">
            {intl.formatMessage(messages.transcriptTabTitle, {
              transcriptCount: video.transcripts.length,
            })}
          </h4>
          <hr className="video-info-sidebar__divider m-0" />
          <div ref={divRef} className="px-1 py-2 transcript-tab__list">
            <ErrorAlert
              hideHeading={false}
              isError={transcriptStatus === RequestStatus.FAILED && !isEmpty(errors.transcript)}
            >
              <ul className="p-0">
                {errors.transcript.map(message => (
                  <li key={`transcript-error-${message}`} style={{ listStyle: 'none' }}>
                    {intl.formatMessage(messages.errorAlertMessage, { message })}
                  </li>
                ))}
              </ul>
            </ErrorAlert>
            {previousSelection.map((transcript, index) => (
              <Transcript
                key={`transcript-row-${transcript || `new-${index}`}`}
                {...{
                  languages,
                  transcript,
                  previousSelection,
                  handleTranscript,
                  editEnabled: transcriptEditorEnabled && !isEmpty(transcript),
                  onEdit: (lang) => setEditorLanguage(lang),
                  onEmptyFile: () => showToast(intl.formatMessage(messages.emptyFileError)),
                  onSizeFail: () => showToast(intl.formatMessage(messages.transcriptFileTooLarge)),
                  onInvalidFile: () => showToast(intl.formatMessage(messages.invalidFileError)),
                }}
              />
            ))}
          </div>
          <div className="border-top border-light-400">
            <Button
              variant="link"
              iconBefore={Add}
              size="sm"
              className="text-primary-500 justify-content-start pl-0 pt-3"
              onClick={handleAddEmptyTranscript}
            >
              {intl.formatMessage(messages.uploadButtonLabel)}
            </Button>
          </div>
        </>
      )}
      {transcriptEditorEnabled && editorLanguage && (
        <TranscriptEditorModal
          isOpen
          onClose={() => setEditorLanguage(null)}
          courseName=""
          videoId={id}
          videoFilename={displayName}
          videoSrc={video.downloadLink || ''}
          language={editorLanguage}
          languageName={languages[editorLanguage] || editorLanguage}
          transcriptDownloadHandlerUrl={transcriptDownloadHandlerUrl}
          transcriptUploadHandlerUrl={transcriptUploadHandlerUrl}
        />
      )}
    </Stack>
  );
};

TranscriptTab.propTypes = {
  video: PropTypes.shape({
    transcripts: PropTypes.arrayOf(PropTypes.string).isRequired,
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    downloadLink: PropTypes.string,
  }).isRequired,
};

export default TranscriptTab;
