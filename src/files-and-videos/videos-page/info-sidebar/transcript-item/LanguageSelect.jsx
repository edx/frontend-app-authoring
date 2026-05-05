import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Icon,
  ModalPopup,
  Menu,
  MenuItem,
  useToggle,
} from '@openedx/paragon';
import {
  Check, ExpandMore, ExpandLess, Search,
} from '@openedx/paragon/icons';
import { isEmpty } from 'lodash';

const LanguageSelect = ({
  value,
  previousSelection,
  options,
  handleSelect,
  placeholderText,
  wrapperClassName,
}) => {
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
        <button
          type="button"
          className={`language-select-trigger border border-gray-700${isOpen ? ' is-open' : ''}`}
          id={`language-select-dropdown-${currentSelection}`}
          data-testid="language-select-dropdown"
          onClick={handleToggle}
          ref={setTarget}
        >
          <span className="language-select-trigger__text">{currentSelection}</span>
          <span className="language-select-trigger__divider" aria-hidden="true" />
          <Icon src={isOpen ? ExpandLess : ExpandMore} className="language-select-trigger__icon" />
        </button>
      </div>
      <ModalPopup
        placement="bottom-end"
        positionRef={target}
        isOpen={isOpen}
        onClose={handleClose}
        onEscapeKey={handleClose}
      >
        <div className="language-select">
          <div className="language-select__search">
            <div className="language-select__search-box">
              <Icon src={Search} className="language-select__search-icon" />
              <input
                type="text"
                className="language-select__search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
              />
            </div>
          </div>
          <Menu className="language-select__list">
            <div>
              {filteredEntries.length === 0 && (
                <div className="language-select__no-results">No results</div>
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
            </div>
          </Menu>
        </div>
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
  wrapperClassName: 'col-9 p-0',
};

export default LanguageSelect;
