import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow,
  AlertModal,
  Button,
  Icon,
  IconButton,
  useToggle,
} from '@openedx/paragon';
import { DeleteOutline } from '@openedx/paragon/icons';
import { injectIntl, FormattedMessage, intlShape } from '@edx/frontend-platform/i18n';
import { isEmpty } from 'lodash';
import LanguageSelect from './LanguageSelect';
import TranscriptMenu from './TranscriptMenu';
import messages from './messages';
import { FileInput, useFileInput } from '../../../generic';
import { validateSrtFile } from '../../transcript-editor/srtUtils';

const Transcript = ({
  languages,
  transcript,
  previousSelection,
  handleTranscript,
  editEnabled,
  onEdit,
  onEmptyFile,
  onSizeFail,
  onInvalidFile,
  // injected
  intl,
}) => {
  const [isConfirmationOpen, openConfirmation, closeConfirmation] = useToggle();
  const [newLanguage, setNewLanguage] = useState(transcript);
  const language = transcript;

  useEffect(() => {
    setNewLanguage(transcript);
  }, [transcript]);

  const input = useFileInput({
    onAddFile: (files) => {
      const [file] = files;
      validateSrtFile(file, {
        onEmptyFail: onEmptyFile,
        onSizeFail,
        onInvalidFail: onInvalidFile,
        onValid: (f) => handleTranscript({ file: f, language, newLanguage }, 'upload'),
      });
    },
    setSelectedRows: () => {},
    setAddOpen: () => {},
  });

  const updateLangauge = (selected) => {
    setNewLanguage(selected);
    if (isEmpty(language)) {
      input.click();
    }
  };

  return (
    <>
      <AlertModal
        title={<FormattedMessage {...messages.deleteConfirmationHeader} />}
        isOpen={isConfirmationOpen}
        onClose={closeConfirmation}
        variant="warning"
        footerNode={(
          <ActionRow>
            <Button variant="tertiary" onClick={closeConfirmation}>
              <FormattedMessage {...messages.cancelDeleteLabel} />
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                handleTranscript({ language: transcript }, 'delete');
                closeConfirmation();
              }}
            >
              <FormattedMessage {...messages.confirmDeleteLabel} />
            </Button>
          </ActionRow>
        )}
      >
        <p><FormattedMessage {...messages.deleteConfirmationMessage} /></p>
      </AlertModal>
      <div
        className="row m-0 align-items-center justify-content-between"
        key={`transcript-${language}`}
        data-testid={`transcript-${language}`}
      >
        <LanguageSelect
          options={languages}
          value={newLanguage}
          placeholderText={intl.formatMessage(messages.languageSelectPlaceholder)}
          previousSelection={previousSelection}
          handleSelect={updateLangauge}
        />
        { transcript === '' ? (
          <IconButton
            iconAs={Icon}
            src={DeleteOutline}
            onClick={openConfirmation}
            alt="delete empty transcript"
          />
        ) : (
          <TranscriptMenu
            {...{
              language,
              newLanguage,
              setNewLanguage,
              handleTranscript,
              input,
              launchDeleteConfirmation: openConfirmation,
              editEnabled,
              onEdit,
            }}
          />
        )}
      </div>
      <FileInput key="transcript-input" fileInput={input} supportedFileFormats={['.srt']} />
    </>
  );
};

Transcript.propTypes = {
  languages: PropTypes.shape({}).isRequired,
  transcript: PropTypes.string.isRequired,
  previousSelection: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleTranscript: PropTypes.func.isRequired,
  editEnabled: PropTypes.bool,
  onEdit: PropTypes.func,
  onEmptyFile: PropTypes.func,
  onSizeFail: PropTypes.func,
  onInvalidFile: PropTypes.func,
  // injected
  intl: intlShape.isRequired,
};

Transcript.defaultProps = {
  editEnabled: false,
  onEdit: () => {},
  onEmptyFile: () => {},
  onSizeFail: () => {},
  onInvalidFile: () => {},
};

export default injectIntl(Transcript);
