import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import {
  Dropdown,
  Icon,
  IconButton,
} from '@openedx/paragon';
import { MoreHoriz } from '@openedx/paragon/icons';

import messages from './messages';

export const TranscriptActionMenu = ({
  language,
  launchDeleteConfirmation,
  handleTranscript,
  input,
  editEnabled,
  onEdit,
}) => (
  <Dropdown drop="down" alignRight>
    <Dropdown.Toggle
      as={IconButton}
      src={MoreHoriz}
      iconAs={Icon}
      alt="Actions dropdown"
      data-testid={`${language}-transcript-menu`}
      id={`transcript-menu-toggle-${language}`}
    />
    <Dropdown.Menu
      className="transcript-menu"
      alignRight
      renderOnMount
      popperConfig={{
        strategy: 'fixed',
        modifiers: [
          { name: 'preventOverflow', options: { boundary: 'viewport' } },
          { name: 'flip', options: { boundary: 'viewport' } },
        ],
      }}
    >
      {editEnabled && (
        <Dropdown.Item
          onClick={() => onEdit(language)}
          data-testid={`${language}-transcript-edit`}
          className="transcript-menu__item"
        >
          <FormattedMessage {...messages.editTranscript} />
        </Dropdown.Item>
      )}
      <Dropdown.Item
        onClick={() => input.click()}
        className="transcript-menu__item"
      >
        <FormattedMessage {...messages.replaceTranscript} />
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => handleTranscript({ language }, 'download')}
        className="transcript-menu__item"
      >
        <FormattedMessage {...messages.downloadTranscript} />
      </Dropdown.Item>
      <Dropdown.Divider className="transcript-menu__divider" />
      <Dropdown.Item
        onClick={launchDeleteConfirmation}
        className="transcript-menu__item transcript-menu__item--danger"
      >
        <FormattedMessage {...messages.deleteTranscript} />
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
);

TranscriptActionMenu.propTypes = {
  language: PropTypes.string.isRequired,
  handleTranscript: PropTypes.func.isRequired,
  launchDeleteConfirmation: PropTypes.func.isRequired,
  input: PropTypes.shape({
    click: PropTypes.func.isRequired,
  }).isRequired,
  editEnabled: PropTypes.bool,
  onEdit: PropTypes.func,
};

TranscriptActionMenu.defaultProps = {
  editEnabled: false,
  onEdit: () => {},
};

export default TranscriptActionMenu;
