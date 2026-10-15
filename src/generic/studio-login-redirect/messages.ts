import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'course-authoring.studio-login-redirect.title',
    defaultMessage: 'Sign in to Studio again',
    description: 'Title of the dialog shown when Studio needs the user to sign in again before it can load or save changes.',
  },
  description: {
    id: 'course-authoring.studio-login-redirect.description',
    defaultMessage: 'Your Studio session has ended, so this page cannot load or save your changes. '
      + 'Sign in again to continue. Changes you have not saved will be lost, so copy anything you want to keep first.',
    description: 'Body of the dialog shown when Studio needs the user to sign in again before it can load or save changes.',
  },
  cancelButton: {
    id: 'course-authoring.studio-login-redirect.button.cancel',
    defaultMessage: 'Cancel',
    description: 'Button that closes the dialog and keeps the user on the page, so they can copy unsaved changes.',
  },
  signInButton: {
    id: 'course-authoring.studio-login-redirect.button.sign-in',
    defaultMessage: 'Sign in',
    description: 'Button that takes the user to the Studio sign-in page, which returns them to this page afterwards.',
  },
});

export default messages;
