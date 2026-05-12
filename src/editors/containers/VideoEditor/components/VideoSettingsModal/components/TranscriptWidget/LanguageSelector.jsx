import React from 'react';
import PropTypes from 'prop-types';

import {
  ActionRow,
  Dropdown,
  Button,
  Form,
  Icon,
  Stack,
} from '@openedx/paragon';

import { Check, Search } from '@openedx/paragon/icons';
import { connect, useDispatch } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';
import { thunkActions, selectors } from '../../../../../../data/redux';
import { videoTranscriptLanguages } from '../../../../../../data/constants/video';
import { FileInput, fileInput } from '../../../../../../sharedComponents/FileInput';
import { validateSrtFile } from '../../../../../../../files-and-videos/videos-page/transcript-editor/srtUtils';
import messages from './messages';

export const hooks = {
  onSelectLanguage: ({
    dispatch, languageBeforeChange, triggerupload, setLocalLang,
  }) => ({ newLang }) => {
    // IF Language is unset, set language and begin upload prompt.
    setLocalLang(newLang);
    if (languageBeforeChange === '') {
      triggerupload();
      return;
    }
    // Else: update language
    dispatch(
      thunkActions.video.updateTranscriptLanguage({
        newLanguageCode: newLang, languageBeforeChange,
      }),
    );
  },

  addFileCallback: ({
    dispatch, localLang, onSizeFail, onInvalidFail,
  }) => (file) => validateSrtFile(file, {
    onSizeFail,
    onInvalidFail,
    onValid: (f) => dispatch(thunkActions.video.uploadTranscript({
      file: f, filename: f.name, language: localLang,
    })),
  }),

};

const LanguageSelector = ({
  index, // For a unique id for the form control
  language,
  // Redux
  openLanguages, // Only allow those languages not already associated with a transcript to be selected
  onSizeFail,
  onInvalidFail,
}) => {
  const intl = useIntl();
  const [localLang, setLocalLang] = React.useState(language);
  const [searchQuery, setSearchQuery] = React.useState('');
  const searchInputRef = React.useCallback((node) => {
    if (node !== null) { node.focus(); }
  }, []);
  const input = fileInput({
    onAddFile: hooks.addFileCallback({
      dispatch: useDispatch(),
      localLang,
      onSizeFail: () => { setLocalLang(language); onSizeFail(); },
      onInvalidFail: () => { setLocalLang(language); onInvalidFail(); },
    }),
  });
  const onLanguageChange = hooks.onSelectLanguage({
    dispatch: useDispatch(),
    languageBeforeChange: localLang,
    setLocalLang,
    triggerupload: () => {
      if (input.ref.current) { input.ref.current.value = ''; }
      input.click();
    },
  });

  const getTitle = () => {
    if (Object.prototype.hasOwnProperty.call(videoTranscriptLanguages, language)) {
      return (
        <ActionRow>
          {videoTranscriptLanguages[language]}
          <ActionRow.Spacer />
          <Icon className="text-primary-500" src={Check} />
        </ActionRow>

      );
    }
    return (
      <ActionRow>
        {intl.formatMessage(messages.languageSelectPlaceholder)}
        <ActionRow.Spacer />
      </ActionRow>
    );
  };

  const filteredLanguages = Object.entries(videoTranscriptLanguages).filter(
    ([, text]) => text && text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>

      <Dropdown
        className="w-100 mb-2"
        onToggle={(isOpen) => { if (!isOpen) { setSearchQuery(''); } }}
      >
        <Dropdown.Toggle
          iconAs={Button}
          aria-label={intl.formatMessage(messages.languageSelectLabel)}
          block
          id={`selectLanguage-form-${index}`}
          className="w-100"
          variant="outline-primary"
        >
          {getTitle()}
        </Dropdown.Toggle>
        <Dropdown.Menu className="w-100 p-0 overflow-hidden">
          <Stack
            className="language-selector-search bg-white rounded overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Stack direction="horizontal" className="language-selector-search__box d-flex align-items-center gap-2 p-2">
              <Icon src={Search} className="language-selector-search__icon" />
              <Form.Control
                type="text"
                controlClassName="language-selector-search__input border-0 shadow-none w-100 p-0 bg-transparent"
                aria-label={intl.formatMessage(messages.languageSearchLabel)}
                placeholder={intl.formatMessage(messages.languageSearchPlaceholder)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
              />
            </Stack>
          </Stack>
          <Stack className="language-selector-list">
            {filteredLanguages.length === 0 && (
              <Stack className="py-2 px-3 small text-muted">{intl.formatMessage(messages.noResults)}</Stack>
            )}
            {filteredLanguages.map(([lang, text]) => {
              if (language === lang) {
                return (
                  <Dropdown.Item key={lang}>
                    {text}
                    <Icon className="text-primary-500" src={Check} />
                  </Dropdown.Item>
                );
              }
              if (openLanguages.some(row => row.includes(lang))) {
                return (
                  <Dropdown.Item key={lang} onClick={() => onLanguageChange({ newLang: lang })}>
                    {text}
                  </Dropdown.Item>
                );
              }
              return (
                <Dropdown.Item key={lang} className="disabled">{text}</Dropdown.Item>
              );
            })}
          </Stack>
        </Dropdown.Menu>
      </Dropdown>
      <FileInput fileInput={input} acceptedFiles=".srt" />
    </>
  );
};

LanguageSelector.defaultProps = {
  openLanguages: [],
  onSizeFail: () => {},
  onInvalidFail: () => {},
};

LanguageSelector.propTypes = {
  openLanguages: PropTypes.arrayOf(PropTypes.string),
  index: PropTypes.number.isRequired,
  language: PropTypes.string.isRequired,
  onSizeFail: PropTypes.func,
  onInvalidFail: PropTypes.func,
};

export const mapStateToProps = (state) => ({
  openLanguages: selectors.video.openLanguages(state),
});

export const mapDispatchToProps = {};

export const LanguageSelectorInternal = LanguageSelector; // For testing only
export default connect(mapStateToProps, mapDispatchToProps)(LanguageSelector);
