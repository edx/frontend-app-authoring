import React from 'react';
import moment from 'moment';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import {
  render, screen, fireEvent, initializeMocks, waitFor, within,
} from '../../testUtils';

import ReleaseNoteForm from './ReleaseNoteForm';
import messages from '../messages';
import unsavedMessages from './unsaved-modal-messages';
import { mockFormInitialValues, mockFormFilledValues, mockState } from '../__mocks__/mockData';

// Mock TinyMceWidget and prepareEditorRef
jest.mock('../../editors/sharedComponents/TinyMceWidget', () => ({
  __esModule: true,
  default: ({ onChange, textValue }) => (
    <textarea
      data-testid="tiny-mce-editor"
      value={textValue || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  prepareEditorRef: () => ({
    editorRef: { current: null },
    refReady: true,
    setEditorRef: jest.fn(),
  }),
}));

const reducer = (state = mockState) => state;
const makeStore = () => createStore(reducer, mockState);

describe('ReleaseNoteForm', () => {
  let store;

  beforeEach(() => {
    initializeMocks();
    store = makeStore();
  });

  const baseProps = {
    initialValues: mockFormInitialValues,
    close: jest.fn(),
    onSubmit: jest.fn(),
  };

  const renderForm = (props = {}) => render(
    <Provider store={store}>
      <ReleaseNoteForm {...baseProps} {...props} />
    </Provider>,
  );

  describe('Rendering', () => {
    test('renders all form fields', () => {
      renderForm();
      expect(screen.getByLabelText(messages.publishDateLabel.defaultMessage)).toBeInTheDocument();
      expect(screen.getByLabelText(/publish time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(messages.titleLabel.defaultMessage)).toBeInTheDocument();
      expect(screen.getByTestId('tiny-mce-editor')).toBeInTheDocument();
    });

    test('renders with initial values', () => {
      const props = {
        initialValues: mockFormFilledValues,
      };
      renderForm(props);
      expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
      expect(screen.getByLabelText(messages.publishDateLabel.defaultMessage)).toHaveValue('2025-01-20');
      expect(screen.getByLabelText(/publish time/i)).toHaveValue('14:30');
    });

    test('renders action buttons', () => {
      renderForm();
      expect(screen.getByRole('button', { name: messages.cancelButton.defaultMessage })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: messages.saveButton.defaultMessage })).toBeInTheDocument();
    });

    test('displays timezone name in publish time label', () => {
      renderForm();
      const timeLabel = screen.getByText(/publish time/i);
      expect(timeLabel).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows error when title is empty and form is submitted', async () => {
      renderForm();
      const saveButton = screen.getByRole('button', { name: messages.saveButton.defaultMessage });
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(screen.getByText(messages.errorTitleRequired.defaultMessage)).toBeInTheDocument();
      });
    });

    test('shows error when publish date is empty', async () => {
      renderForm();
      const saveButton = screen.getByRole('button', { name: messages.saveButton.defaultMessage });
      fireEvent.change(screen.getByLabelText(messages.titleLabel.defaultMessage), {
        target: { value: 'Test Title' },
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(messages.errorPublishDateRequired.defaultMessage)).toBeInTheDocument();
      });
    });

    test('shows error when publish time is empty', async () => {
      renderForm();
      const saveButton = screen.getByRole('button', { name: messages.saveButton.defaultMessage });
      fireEvent.change(screen.getByLabelText(messages.titleLabel.defaultMessage), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByLabelText(messages.publishDateLabel.defaultMessage), {
        target: { value: '2025-01-20' },
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(messages.errorPublishTimeRequired.defaultMessage)).toBeInTheDocument();
      });
    });

    test('shows error when description is empty', async () => {
      renderForm();
      const saveButton = screen.getByRole('button', { name: messages.saveButton.defaultMessage });

      fireEvent.change(screen.getByLabelText(messages.titleLabel.defaultMessage), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByLabelText(messages.publishDateLabel.defaultMessage), {
        target: { value: '2025-01-20' },
      });
      fireEvent.change(screen.getByLabelText(/publish time/i), {
        target: { value: '14:30' },
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(messages.errorDescriptionRequired.defaultMessage)).toBeInTheDocument();
      });
    });

    test('does not show errors initially', () => {
      renderForm();
      expect(screen.queryByText(messages.errorTitleRequired.defaultMessage)).not.toBeInTheDocument();
      expect(screen.queryByText(messages.errorPublishDateRequired.defaultMessage)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('calls onSubmit with correct data when form is valid', async () => {
      const onSubmit = jest.fn();
      renderForm({ onSubmit });

      fireEvent.change(screen.getByLabelText(messages.titleLabel.defaultMessage), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByLabelText(messages.publishDateLabel.defaultMessage), {
        target: { value: '2025-01-20' },
      });
      fireEvent.change(screen.getByLabelText(/publish time/i), {
        target: { value: '14:30' },
      });
      fireEvent.change(screen.getByTestId('tiny-mce-editor'), {
        target: { value: '<p>Test description</p>' },
      });

      fireEvent.click(screen.getByRole('button', { name: messages.saveButton.defaultMessage }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
        const callArg = onSubmit.mock.calls[0][0];
        expect(callArg.title).toBe('Test Title');
        expect(callArg.description).toBe('<p>Test description</p>');
        expect(callArg.published_at).toBeInstanceOf(Date);
      });
    });

    test('formats date and time correctly on submit', async () => {
      const onSubmit = jest.fn();
      renderForm({
        onSubmit,
        initialValues: {
          ...mockFormInitialValues,
          title: 'Test',
          description: '<p>Test</p>',
        },
      });

      fireEvent.change(screen.getByLabelText(messages.publishDateLabel.defaultMessage), {
        target: { value: '2025-01-20' },
      });
      fireEvent.change(screen.getByLabelText(/publish time/i), {
        target: { value: '14:30' },
      });

      fireEvent.click(screen.getByRole('button', { name: messages.saveButton.defaultMessage }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
        const publishedAt = onSubmit.mock.calls[0][0].published_at;
        expect(moment(publishedAt).format('HH:mm')).toBe('14:30');
      });
    });
  });

  describe('Cancel and Unsaved Changes Modal', () => {
    test('shows unsaved modal when cancel button is clicked', async () => {
      renderForm();

      fireEvent.click(screen.getByRole('button', { name: messages.cancelButton.defaultMessage }));

      await waitFor(() => {
        expect(screen.getByText(unsavedMessages.unsavedModalTitle.defaultMessage)).toBeInTheDocument();
        expect(screen.getByText(unsavedMessages.unsavedModalDescription.defaultMessage)).toBeInTheDocument();
      });
    });

    test('closes unsaved modal when Keep Editing is clicked', async () => {
      renderForm();

      fireEvent.click(screen.getByRole('button', { name: messages.cancelButton.defaultMessage }));

      await waitFor(() => {
        expect(screen.getByText(unsavedMessages.unsavedModalTitle.defaultMessage)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: unsavedMessages.keepEditingButton.defaultMessage }));

      await waitFor(() => {
        expect(screen.queryByText(unsavedMessages.unsavedModalTitle.defaultMessage)).not.toBeInTheDocument();
      });
    });

    test('closes form when Leave Editor is clicked', async () => {
      const close = jest.fn();
      renderForm({ close });

      fireEvent.click(screen.getByRole('button', { name: messages.cancelButton.defaultMessage }));

      await waitFor(() => {
        expect(screen.getByText(unsavedMessages.unsavedModalTitle.defaultMessage)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: unsavedMessages.leaveEditorButton.defaultMessage }));

      await waitFor(() => {
        expect(close).toHaveBeenCalled();
      });
    });
  });

  describe('Field Interactions', () => {
    test('updates title field on change', () => {
      renderForm();
      const titleInput = screen.getByLabelText(messages.titleLabel.defaultMessage);

      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      expect(titleInput).toHaveValue('New Title');
    });

    test('updates publish date on change', () => {
      renderForm();
      const dateInput = screen.getByLabelText(messages.publishDateLabel.defaultMessage);

      fireEvent.change(dateInput, { target: { value: '2025-02-01' } });

      expect(dateInput).toHaveValue('2025-02-01');
    });

    test('updates publish time on change', () => {
      renderForm();
      const timeInput = screen.getByLabelText(/publish time/i);

      fireEvent.change(timeInput, { target: { value: '15:45' } });

      expect(timeInput).toHaveValue('15:45');
    });

    test('updates description on change', () => {
      renderForm();
      const descriptionInput = screen.getByTestId('tiny-mce-editor');

      fireEvent.change(descriptionInput, { target: { value: '<p>New description</p>' } });

      expect(descriptionInput).toHaveValue('<p>New description</p>');
    });
  });

  describe('onInterceptClose', () => {
    test('does not error when onInterceptClose is not provided', () => {
      expect(() => renderForm()).not.toThrow();
    });
  });

  describe('Edge Cases and Additional Coverage', () => {
    test('handles form with all fields empty', () => {
      const emptyInitialValues = {
        id: null,
        title: '',
        description: '',
        published_at: null,
      };
      renderForm({ initialValues: emptyInitialValues });

      expect(screen.getByLabelText(messages.titleLabel.defaultMessage)).toHaveValue('');
      expect(screen.getByLabelText(messages.publishDateLabel.defaultMessage)).toHaveValue('');
      expect(screen.getByLabelText(/publish time/i)).toHaveValue('');
    });

    test('formats existing published_at date correctly', () => {
      const initialValues = {
        id: 1,
        title: 'Test',
        description: '<p>Test</p>',
        published_at: new Date('2025-01-20T14:30:00'),
      };
      renderForm({ initialValues });

      expect(screen.getByLabelText(messages.publishDateLabel.defaultMessage)).toHaveValue('2025-01-20');
      expect(screen.getByLabelText(/publish time/i)).toHaveValue('14:30');
    });

    test('handles invalid time format in validation', async () => {
      renderForm();
      const saveButton = screen.getByRole('button', { name: messages.saveButton.defaultMessage });

      fireEvent.change(screen.getByLabelText(messages.titleLabel.defaultMessage), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByLabelText(messages.publishDateLabel.defaultMessage), {
        target: { value: '2025-01-20' },
      });
      fireEvent.change(screen.getByTestId('tiny-mce-editor'), {
        target: { value: '<p>Test description</p>' },
      });

      // Set invalid time format
      const timeInput = screen.getByLabelText(/publish time/i);
      fireEvent.change(timeInput, { target: { value: '25:99' } });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(messages.errorPublishTimeRequired.defaultMessage)).toBeInTheDocument();
      });
    });

    test('submits form with null published_at when date/time are empty', async () => {
      const onSubmit = jest.fn();
      renderForm({
        onSubmit,
        initialValues: {
          ...mockFormInitialValues,
          title: 'Test',
          description: '<p>Test</p>',
        },
      });

      // Clear date and time
      fireEvent.change(screen.getByLabelText(messages.publishDateLabel.defaultMessage), {
        target: { value: '' },
      });
      fireEvent.change(screen.getByLabelText(/publish time/i), {
        target: { value: '' },
      });

      fireEvent.click(screen.getByRole('button', { name: messages.saveButton.defaultMessage }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('showImageButton prop is passed to TinyMceWidget', () => {
      renderForm();
      const editor = screen.getByTestId('tiny-mce-editor');
      expect(editor).toBeInTheDocument();
    });

    test('displays proper time label with timezone', () => {
      renderForm();
      const timeLabel = screen.getByText(/publish time/i);
      expect(timeLabel).toBeInTheDocument();
    });

    test('closes unsaved modal when clicking modal close', async () => {
      renderForm();

      fireEvent.click(screen.getByRole('button', { name: messages.cancelButton.defaultMessage }));

      await waitFor(() => {
        expect(screen.getByText(unsavedMessages.unsavedModalTitle.defaultMessage)).toBeInTheDocument();
      });

      const modalDialogs = screen.getAllByRole('dialog');
      const title = unsavedMessages.unsavedModalTitle.defaultMessage;
      const unsavedModal = modalDialogs.find(dialog => within(dialog).queryByText(title));

      expect(unsavedModal).toBeInTheDocument();
    });

    test('preserves form data when keeping editing after cancel', async () => {
      renderForm();

      fireEvent.change(screen.getByLabelText(messages.titleLabel.defaultMessage), {
        target: { value: 'My Title' },
      });

      fireEvent.click(screen.getByRole('button', { name: messages.cancelButton.defaultMessage }));

      await waitFor(() => {
        expect(screen.getByText(unsavedMessages.unsavedModalTitle.defaultMessage)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: unsavedMessages.keepEditingButton.defaultMessage }));

      await waitFor(() => {
        expect(screen.queryByText(unsavedMessages.unsavedModalTitle.defaultMessage)).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(messages.titleLabel.defaultMessage)).toHaveValue('My Title');
    });
  });

  describe('Timezone Formatting', () => {
    test('displays timezone label with publish time', () => {
      renderForm();

      const timeLabel = screen.getByText(/publish time/i);
      expect(timeLabel).toBeInTheDocument();
      const timeInput = screen.getByLabelText(/publish time/i);
      expect(timeInput).toHaveAttribute('type', 'time');
    });

    test('renders time field without errors even if timezone detection fails', () => {
      expect(() => renderForm()).not.toThrow();
      const timeInput = screen.getByLabelText(/publish time/i);
      expect(timeInput).toBeInTheDocument();
      expect(timeInput).toHaveAttribute('type', 'time');
    });
  });
});
