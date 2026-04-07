import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import {
  ActionRow,
  Alert,
  Button,
  ProgressBar,
  Stack,
} from '@openedx/paragon';
import { FileUpload, InfoOutline } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';

import { useEditorContext } from '@src/editors/EditorContext';
import { selectors } from '../../../../../../data/redux';
import { RequestKeys } from '../../../../../../data/constants/requests';
import { FileInput } from '../../../../../../sharedComponents/FileInput';
import ErrorAlert from '../../../../../../sharedComponents/ErrorAlerts/ErrorAlert';
import UploadErrorAlert from '../../../../../../sharedComponents/ErrorAlerts/UploadErrorAlert';
import CollapsibleFormWidget from '../CollapsibleFormWidget';
import { ErrorContext } from '../../../../hooks';
import * as hooks from './hooks';
import messages from './messages';

/**
 * Collapsible widget for uploading and managing the audio description (AD)
 * track for a video block. Mirrors HandoutWidget's structure but uses the
 * 3-step direct-to-S3 upload flow with a progress bar and cancel button.
 */
const AudioDescriptionWidget = ({
  // redux
  isLibrary,
  audioDescription,
  uploadProgress,
  isUploading,
  isUploadFailed,
  durationTotal,
}) => {
  const intl = useIntl();
  // Gated by the contentstore.enable_audio_description_upload waffle flag.
  // When the flag is off the entire upload UI disappears; the matching
  // studio_audio_description XBlock handler also returns 404 in that
  // state, so the UI and the API are consistently hidden.
  const { isAudioDescriptionUploadEnabledForContext } = useEditorContext();
  // The error context is shared with the rest of the editor and is wired up
  // to drive the ErrorSummary banner above the modal body.
  // eslint-disable-next-line no-unused-vars
  const [_error, setError] = React.useContext(ErrorContext).audioDescription;

  const fileSizeErr = hooks.fileSizeError();
  const fileTypeErr = hooks.fileTypeError();
  const durationWarn = hooks.durationWarning();
  const abortControllerRef = hooks.useAbortControllerRef();

  const uploadAudioDescription = hooks.useAudioDescriptionUpload();
  const deleteAudioDescription = hooks.useAudioDescriptionDelete();

  const videoDurationSeconds = hooks.parseVideoDurationSeconds(durationTotal);

  const fileInput = hooks.fileInput({
    fileSizeErr,
    fileTypeErr,
    durationWarn,
    videoDurationSeconds,
    abortControllerRef,
    uploadAudioDescription,
  });

  hooks.useBeforeUnloadGuard(isUploading);

  // Push upload-failed state into the editor-wide error context so it
  // surfaces in ErrorSummary alongside other widget errors.
  React.useEffect(() => {
    setError(isUploadFailed ? { upload: 'failed' } : {});
  }, [isUploadFailed, setError]);

  // If the modal closes while an upload is in progress, abort the PUT and
  // throw the pending edx-val record away.
  React.useEffect(() => () => {
    if (abortControllerRef.ref.current) {
      abortControllerRef.abort();
      // Best-effort cleanup of the pending DB row.
      deleteAudioDescription();
    }
    // We deliberately want this to fire only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fileName = hooks.parseFileName(audioDescription);

  const handleCancel = () => {
    abortControllerRef.abort();
    deleteAudioDescription();
  };

  if (isLibrary || !isAudioDescriptionUploadEnabledForContext) {
    return null;
  }

  return (
    <CollapsibleFormWidget
      fontSize="x-small"
      isError={fileSizeErr.show || fileTypeErr.show || isUploadFailed}
      title={intl.formatMessage(messages.titleLabel)}
      subtitle={fileName || ''}
    >
      <ErrorAlert
        dismissError={fileSizeErr.dismiss}
        hideHeading
        isError={fileSizeErr.show}
      >
        <FormattedMessage {...messages.fileSizeError} />
      </ErrorAlert>
      <ErrorAlert
        dismissError={fileTypeErr.dismiss}
        hideHeading
        isError={fileTypeErr.show}
      >
        <FormattedMessage {...messages.fileTypeError} />
      </ErrorAlert>
      <UploadErrorAlert
        isUploadError={isUploadFailed}
        message={messages.uploadAudioDescriptionError}
      />
      {durationWarn.warning && (
        <Alert
          variant="warning"
          icon={InfoOutline}
          dismissible
          onClose={durationWarn.dismiss}
        >
          <FormattedMessage
            {...messages.durationWarning}
            values={{
              adDuration: durationWarn.warning.adDuration,
              videoDuration: durationWarn.warning.videoDuration,
            }}
          />
        </Alert>
      )}

      <FileInput fileInput={fileInput} acceptedFiles={hooks.ALLOWED_EXTENSIONS} />

      {isUploading ? (
        <Stack gap={3}>
          <FormattedMessage
            {...messages.uploadingMessage}
            values={{ fileName: fileName || '' }}
          />
          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
          <ActionRow>
            <ActionRow.Spacer />
            <Button variant="tertiary" size="sm" onClick={handleCancel}>
              <FormattedMessage {...messages.cancelUpload} />
            </Button>
          </ActionRow>
        </Stack>
      ) : audioDescription ? (
        <Stack gap={3}>
          <ActionRow className="border border-gray-300 rounded px-3 py-2">
            {fileName}
            <ActionRow.Spacer />
            <Button variant="tertiary" size="sm" onClick={() => deleteAudioDescription()}>
              <FormattedMessage {...messages.deleteAudioDescription} />
            </Button>
          </ActionRow>
        </Stack>
      ) : (
        <Stack gap={3}>
          <FormattedMessage {...messages.addAudioDescriptionMessage} />
          <Button
            className="text-primary-500 font-weight-bold justify-content-start pl-0"
            size="sm"
            iconBefore={FileUpload}
            onClick={fileInput.click}
            variant="link"
          >
            <FormattedMessage {...messages.uploadButtonLabel} />
          </Button>
        </Stack>
      )}
    </CollapsibleFormWidget>
  );
};

AudioDescriptionWidget.defaultProps = {
  audioDescription: null,
  durationTotal: null,
};

AudioDescriptionWidget.propTypes = {
  // redux
  isLibrary: PropTypes.bool.isRequired,
  audioDescription: PropTypes.string,
  uploadProgress: PropTypes.number.isRequired,
  isUploading: PropTypes.bool.isRequired,
  isUploadFailed: PropTypes.bool.isRequired,
  durationTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export const mapStateToProps = (state) => ({
  isLibrary: selectors.app.isLibrary(state),
  audioDescription: selectors.video.audioDescription(state),
  uploadProgress: selectors.video.audioDescriptionUploadProgress(state) || 0,
  isUploading: selectors.requests.isPending(
    state,
    { requestKey: RequestKeys.uploadAudioDescriptionToS3 },
  ) || selectors.requests.isPending(
    state,
    { requestKey: RequestKeys.getAudioDescriptionUploadUrl },
  ) || selectors.requests.isPending(
    state,
    { requestKey: RequestKeys.completeAudioDescriptionUpload },
  ),
  isUploadFailed: selectors.requests.isFailed(
    state,
    { requestKey: RequestKeys.uploadAudioDescriptionToS3 },
  ) || selectors.requests.isFailed(
    state,
    { requestKey: RequestKeys.getAudioDescriptionUploadUrl },
  ) || selectors.requests.isFailed(
    state,
    { requestKey: RequestKeys.completeAudioDescriptionUpload },
  ),
  durationTotal: selectors.video.duration(state)?.total,
});

export const AudioDescriptionWidgetInternal = AudioDescriptionWidget; // For testing only
export default connect(mapStateToProps)(AudioDescriptionWidget);
