import { useSyncExternalStore } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';

import ModalNotification from '@src/generic/modal-notification';
import {
  closeSignInPrompt,
  getIsSignInPromptOpen,
  signInToStudio,
  subscribeToSignInPrompt,
} from '.';
import messages from './messages';

/**
 * Asks the user to sign in to Studio again, when Studio refuses a request for lack of a Studio session
 * and leaving the page right away could lose the user's changes.
 */
const StudioLoginModal = () => {
  const intl = useIntl();
  const isOpen = useSyncExternalStore(subscribeToSignInPrompt, getIsSignInPromptOpen);

  return (
    <ModalNotification
      isOpen={isOpen}
      title={intl.formatMessage(messages.title)}
      message={intl.formatMessage(messages.description)}
      cancelButtonText={intl.formatMessage(messages.cancelButton)}
      actionButtonText={intl.formatMessage(messages.signInButton)}
      handleCancel={closeSignInPrompt}
      handleAction={signInToStudio}
      variant="warning"
    />
  );
};

export default StudioLoginModal;
