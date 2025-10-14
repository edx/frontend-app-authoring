import React from 'react';
import moment from 'moment';
import {
  render, screen, fireEvent, initializeMocks,
} from '../../testUtils';

import ReleaseNoteForm from './ReleaseNoteForm';
import messages from '../messages';

jest.mock('../../generic/WysiwygEditor');

describe('ReleaseNoteForm', () => {
  beforeEach(() => {
    initializeMocks();
  });

  const baseProps = {
    initialValues: {
      id: undefined, title: '', description: '', published_at: '',
    },
    close: jest.fn(),
    onSubmit: jest.fn(),
  };

  test('renders fields with initial values', () => {
    const props = {
      ...baseProps,
      initialValues: {
        id: 5,
        title: 'Hello',
        description: '<p>world</p>',
        published_at: moment().toISOString(),
      },
    };
    render(<ReleaseNoteForm {...props} />);
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    expect(screen.getByLabelText(messages.publishTimeLabel.defaultMessage)).toBeInTheDocument();
  });

  test('cancel calls close', () => {
    render(<ReleaseNoteForm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: messages.cancelButton.defaultMessage }));
    fireEvent.click(screen.getByRole('button', { name: /leave editor/i }));
    expect(baseProps.close).toHaveBeenCalled();
  });
});
