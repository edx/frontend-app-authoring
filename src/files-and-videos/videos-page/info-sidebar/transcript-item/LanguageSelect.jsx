import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Form,
  Icon,
  Stack,
  ModalPopup,
  Menu,
  MenuItem,
  useToggle,
} from '@openedx/paragon';
import './LanguageSelect.scss';
import {
  Check, ExpandMore, ExpandLess, Search,
} from '@openedx/paragon/icons';
import { isEmpty } from 'lodash';
import { useIntl } from '@edx/frontend-platform/i18n';
import messages from './messages';

const LanguageSelect = ({
  value,
  previousSelection,
  options,
  handleSelect,
  placeholderText,
  wrapperClassName,
}) => {
  const intl = useIntl();
  const currentSelection = isEmpty(value) ? placeholderText : options[value];

  const [isOpen, , close, toggle] = useToggle();
  const [target, setTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useCallback((node) => {
    if (node !== null) { node.focus(); }
  }, []);

  const handleClose = () => {
    setSearchQuery('');
    close();
  };

  const handleToggle = () => {
    if (isOpen) {
      setSearchQuery('');
    }
    toggle();
  };

  const filteredEntries = Object.entries(options).filter(
    ([, text]) => text && text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <div className={wrapperClassName}>
        <Button
          block
          className={`language-select-trigger d-flex w-100 rounded border border-gray-700 align-items-center justify-content-start text-start${isOpen ? ' is-open' : ''}`}
          variant="tertiary"
          id={`language-select-dropdown-${currentSelection}`}
          data-testid="language-select-dropdown"
          onClick={handleToggle}
          ref={setTarget}
        >
          <span className="language-select-trigger__text flex-grow-1 text-start text-truncate">{currentSelection}</span>
          <span className="language-select-trigger__divider d-inline-block flex-shrink-0" aria-hidden="true" />
          <Icon src={isOpen ? ExpandLess : ExpandMore} className="language-select-trigger__icon flex-shrink-0" />
        </Button>
      </div>
      <ModalPopup
        placement="bottom-end"
        positionRef={target}
        isOpen={isOpen}
        onClose={handleClose}
        onEscapeKey={handleClose}
      >
        <Stack
          className="language-select bg-white rounded overflow-hidden"
          style={{ width: target ? target.offsetWidth : undefined }}
        >
          <Stack className="language-select__search sticky-top bg-white">
            <Stack direction="horizontal" className="language-select__search-box align-items-center gap-2 rounded">
              <Icon src={Search} className="language-select__search-icon flex-shrink-0" />
              <Form.Control
                type="text"
                controlClassName="language-select__search-input border-0 shadow-none w-100 p-0 bg-transparent"
                aria-label={intl.formatMessage(messages.languageSearchLabel)}
                placeholder={intl.formatMessage(messages.languageSearchPlaceholder)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
              />
            </Stack>
          </Stack>
          <Menu className="language-select__list m-0">
            <Stack>
              {filteredEntries.length === 0 && (
                <Stack className="language-select__no-results small text-muted">{intl.formatMessage(messages.noResults)}</Stack>
              )}
              {filteredEntries.map(([valueKey, text]) => {
                if (valueKey === value) {
                  return (
                    <MenuItem
                      as={Button}
                      variant="tertiary"
                      size="sm"
                      key={`${valueKey}-item`}
                    >
                      <Icon size="inline" src={Check} />
                      <span className="pl-1">{text}</span>
                    </MenuItem>
                  );
                }
                if (!previousSelection.includes(valueKey)) {
                  return (
                    <MenuItem
                      as={Button}
                      variant="tertiary"
                      size="sm"
                      onClick={() => {
                        handleSelect(valueKey);
                        handleClose();
                      }}
                      key={`${valueKey}-item`}
                    >
                      <span className="pl-3">{text}</span>
                    </MenuItem>
                  );
                }
                return (
                  <MenuItem
                    disabled
                    variant="tertiary"
                    as={Button}
                    size="sm"
                    key={`${valueKey}-item`}
                  >
                    <span className="pl-3">{text}</span>
                  </MenuItem>
                );
              })}
            </Stack>
          </Menu>
        </Stack>
      </ModalPopup>
    </>
  );
};

LanguageSelect.propTypes = {
  value: PropTypes.string.isRequired,
  options: PropTypes.shape({}).isRequired,
  handleSelect: PropTypes.func.isRequired,
  placeholderText: PropTypes.string.isRequired,
  previousSelection: PropTypes.arrayOf(PropTypes.string).isRequired,
  wrapperClassName: PropTypes.string,
};

LanguageSelect.defaultProps = {
  wrapperClassName: 'col p-0',
};

export default LanguageSelect;
