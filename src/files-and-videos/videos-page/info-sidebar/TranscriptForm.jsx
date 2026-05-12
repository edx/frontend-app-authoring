import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Icon, IconButton, Spinner, Stack,
} from '@openedx/paragon';
import {
  Article, DeleteOutline, ErrorOutline, FileUpload,
} from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { isEmpty } from 'lodash';

import LanguageSelect from './transcript-item/LanguageSelect';
import { FileInput, useFileInput } from '../../generic';
import { validateSrtFile } from '../transcript-editor/srtUtils';
import messages from './messages';
import transcriptItemMessages from './transcript-item/messages';

const TranscriptForm = ({
  languages,
  previousSelection,
  onCancel,
  onSubmit,
  onFileTooLarge,
  isUploading,
  uploadFailed,
}) => {
  const intl = useIntl();
  const [language, setLanguage] = useState('');
  const [file, setFile] = useState(null);

  const [localError, setLocalError] = useState(null);

  const input = useFileInput({
    onAddFile: (files) => {
      const [picked] = files;
      validateSrtFile(picked, {
        onSizeFail: () => {
          setLocalError(null);
          setFile(null);
          onFileTooLarge();
        },
        onInvalidFail: () => { setLocalError('invalid'); setFile(null); },
        onValid: (f) => { setLocalError(null); setFile(f); },
      });
    },
    setSelectedRows: () => {},
    setAddOpen: () => {},
  });

  const canSubmit = !isEmpty(language) && file && !localError;

  const uploadButton = (
    <>
      <Button
        variant="outline-primary"
        onClick={() => input.click()}
        iconBefore={FileUpload}
        className="new-transcript-form__upload-button rounded-0 w-100 justify-content-center"
        block
      >
        <FormattedMessage {...messages.uploadFileButton} />
      </Button>
      <Stack className="new-transcript-form__hint">
        <FormattedMessage {...messages.uploadFileHint} />
      </Stack>
    </>
  );

  const renderUploadArea = () => {
    if (isUploading) {
      return (
        <Stack direction="horizontal" className="new-transcript-form__file-row d-flex align-items-center gap-2 py-2 px-1 small">
          <Spinner animation="border" size="sm" className="new-transcript-form__spinner" />
          <span className="new-transcript-form__uploading-name flex-grow-1 text-truncate">{file?.name}</span>
        </Stack>
      );
    }
    if (uploadFailed || localError) {
      return (
        <>
          <Stack direction="horizontal" className="new-transcript-form__file-row d-flex align-items-center new-transcript-form__file-row--error gap-2 py-2 px-1 small text-danger">
            <Icon src={ErrorOutline} className="new-transcript-form__error-icon flex-shrink-0" />
            <span className="new-transcript-form__error-text flex-grow-1 small">
              {localError === 'invalid' && <FormattedMessage {...messages.invalidFileError} />}
              {uploadFailed && !localError && <FormattedMessage {...messages.uploadFailedError} />}
            </span>
          </Stack>
          {uploadButton}
        </>
      );
    }
    if (file) {
      return (
        <Stack direction="horizontal" className="new-transcript-form__file-row d-flex align-items-center gap-2 py-2 px-1 small">
          <Icon src={Article} className="new-transcript-form__file-icon flex-shrink-0" />
          <span className="new-transcript-form__file-name flex-grow-1 text-truncate">{file.name}</span>
          <IconButton
            src={DeleteOutline}
            iconAs={Icon}
            alt={intl.formatMessage(messages.clearFileLabel)}
            onClick={() => setFile(null)}
            size="sm"
            className="new-transcript-form__file-delete flex-shrink-0"
          />
        </Stack>
      );
    }
    return uploadButton;
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    onSubmit({ language, file });
  };

  return (
    <Stack className="new-transcript-form pt-1 pb-2">
      <h4 className="new-transcript-form__heading mt-0 mb-3">
        <FormattedMessage {...messages.newTranscriptHeading} />
      </h4>

      <Stack className="new-transcript-form__field">
        <LanguageSelect
          options={languages}
          value={language}
          placeholderText={intl.formatMessage(transcriptItemMessages.languageSelectPlaceholder)}
          previousSelection={previousSelection}
          handleSelect={setLanguage}
          wrapperClassName="col-12 p-0"
        />
      </Stack>

      <Stack className="new-transcript-form__upload mb-1">
        {renderUploadArea()}
      </Stack>

      <Stack direction="horizontal" gap={2} className="new-transcript-form__actions justify-content-end">
        <Button variant="tertiary" onClick={onCancel} disabled={isUploading}>
          <FormattedMessage {...messages.cancelLabel} />
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit || isUploading}
          className="new-transcript-form__submit-button"
        >
          <FormattedMessage {...messages.addTranscriptLabel} />
        </Button>
      </Stack>

      <FileInput key="new-transcript-input" fileInput={input} supportedFileFormats={['.srt']} />
    </Stack>
  );
};

TranscriptForm.propTypes = {
  languages: PropTypes.shape({}).isRequired,
  previousSelection: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onFileTooLarge: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  uploadFailed: PropTypes.bool,
};

TranscriptForm.defaultProps = {
  isUploading: false,
  uploadFailed: false,
};

export default TranscriptForm;
