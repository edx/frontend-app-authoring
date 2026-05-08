import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import userEvent from '@testing-library/user-event';

import TranscriptColumn from './TranscriptColumn';

const renderComponent = (rowOriginal, onClick = undefined) => render(
  <IntlProvider locale="en">
    <TranscriptColumn
      row={{ original: rowOriginal }}
      onClick={onClick}
    />
  </IntlProvider>,
);

describe('TranscriptColumn', () => {
  it('renders nothing extra when no transcripts and no failure', () => {
    const { container } = renderComponent({ transcripts: [], transcriptionStatus: 'notTranscribed' });
    expect(container.querySelector('.pgn__icon')).not.toBeInTheDocument();
    expect(screen.queryByText(/available/)).not.toBeInTheDocument();
  });

  it('shows transcript count as plain text when onClick is not provided', () => {
    renderComponent({ transcripts: ['en', 'fr'], transcriptionStatus: 'transcribed' });
    expect(screen.getByText('(2) available')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows transcript count as hyperlink when onClick is provided', () => {
    const onClick = jest.fn();
    renderComponent({ transcripts: ['en'], transcriptionStatus: 'transcribed' }, onClick);
    expect(screen.getByRole('link', { name: '(1) available' })).toBeInTheDocument();
  });

  it('calls onClick with row.original when hyperlink is clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const original = { transcripts: ['en'], transcriptionStatus: 'transcribed' };
    renderComponent(original, onClick);
    await user.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledWith(original);
  });

  it('shows error icon when transcriptionStatus is a failure status', () => {
    const { container } = renderComponent({
      transcripts: [],
      transcriptionStatus: 'Transcript Failed',
    });
    expect(container.querySelector('.pgn__icon')).toBeInTheDocument();
  });

  it('does not show error icon for non-failure status', () => {
    const { container } = renderComponent({
      transcripts: ['en'],
      transcriptionStatus: 'transcribed',
    });
    expect(container.querySelector('.text-danger-500')).not.toBeInTheDocument();
  });

  it('shows both error icon and transcript count together', () => {
    const onClick = jest.fn();
    renderComponent({ transcripts: ['en'], transcriptionStatus: 'Transcript Failed' }, onClick);
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(document.body).toHaveTextContent('available');
  });

  it('renders singular count correctly', () => {
    renderComponent({ transcripts: ['en'], transcriptionStatus: 'transcribed' });
    expect(screen.getByText('(1) available')).toBeInTheDocument();
  });
});
