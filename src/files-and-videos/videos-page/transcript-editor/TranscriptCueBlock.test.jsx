import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
} from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import TranscriptCueBlock from './TranscriptCueBlock';

const defaultProps = {
  index: 0,
  startMs: 0,
  endMs: 1500,
  text: 'Hello world',
  onChange: jest.fn(),
  onChangeStart: jest.fn(),
  onChangeEnd: jest.fn(),
  onSeek: jest.fn(),
  onDelete: jest.fn(),
  onInsertAfter: jest.fn(),
  isActive: false,
  errors: [],
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <TranscriptCueBlock {...defaultProps} {...props} />
  </IntlProvider>,
);

describe('TranscriptCueBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the textarea with the provided text', () => {
    renderComponent();
    expect(screen.getByRole('textbox', { name: /Transcript cue at/i })).toHaveValue('Hello world');
  });

  it('calls onChange when textarea value changes', () => {
    const onChange = jest.fn();
    renderComponent({ onChange });
    fireEvent.change(screen.getByRole('textbox', { name: /Transcript cue at/i }), {
      target: { value: 'Updated text' },
    });
    expect(onChange).toHaveBeenCalledWith(0, 'Updated text');
  });

  it('applies active class when isActive is true', () => {
    const { container } = renderComponent({ isActive: true });
    expect(container.querySelector('.transcript-cue-block--active')).toBeInTheDocument();
  });

  it('does not apply active class when isActive is false', () => {
    const { container } = renderComponent({ isActive: false });
    expect(container.querySelector('.transcript-cue-block--active')).not.toBeInTheDocument();
  });

  it('renders error list when errors are provided', () => {
    renderComponent({ errors: ['Empty cue', 'End before start'] });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Empty cue')).toBeInTheDocument();
    expect(screen.getByText('End before start')).toBeInTheDocument();
  });

  it('does not render error list when errors is empty', () => {
    renderComponent({ errors: [] });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies invalid class to cue block and textarea when errors are present', () => {
    const { container } = renderComponent({ errors: ['invalid'] });
    expect(container.querySelector('.transcript-cue-block--invalid')).toBeInTheDocument();
    expect(container.querySelector('.transcript-cue-block__textarea--invalid')).toBeInTheDocument();
  });

  it('sets aria-invalid to true on textarea when errors present', () => {
    renderComponent({ errors: ['some error'] });
    expect(screen.getByRole('textbox', { name: /Transcript cue at/i })).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets aria-invalid to false on textarea when no errors', () => {
    renderComponent({ errors: [] });
    expect(screen.getByRole('textbox', { name: /Transcript cue at/i })).toHaveAttribute('aria-invalid', 'false');
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = jest.fn();
    renderComponent({ onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Delete cue' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(0);
  });

  it('calls onSeek with startMs when seek button clicked', () => {
    const onSeek = jest.fn();
    renderComponent({ onSeek, startMs: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /Seek to/i }));
    expect(onSeek).toHaveBeenCalledWith(5000);
  });

  it('does not throw when onSeek is null and seek button clicked', () => {
    renderComponent({ onSeek: null });
    // Should not throw
    expect(() => fireEvent.click(screen.getByRole('button', { name: /Seek to/i }))).not.toThrow();
  });

  it('calls onInsertAfter when insert button clicked', () => {
    const onInsertAfter = jest.fn();
    renderComponent({ onInsertAfter });
    fireEvent.click(screen.getByTitle('Insert cue here'));
    expect(onInsertAfter).toHaveBeenCalledTimes(1);
    expect(onInsertAfter).toHaveBeenCalledWith(0);
  });

  it('renders start time input with formatted value', () => {
    renderComponent({ startMs: 3723000 }); // 1:02:03,000
    expect(screen.getByLabelText('Start time')).toHaveValue('01:02:03,000');
  });

  it('renders end time input with formatted value', () => {
    renderComponent({ endMs: 1500 }); // 0:00:01,500
    expect(screen.getByLabelText('End time')).toHaveValue('00:00:01,500');
  });

  it('calls onChangeStart with parsed ms on blur of start time input', () => {
    const onChangeStart = jest.fn();
    renderComponent({ onChangeStart, startMs: 0 });
    const startInput = screen.getByLabelText('Start time');
    fireEvent.change(startInput, { target: { value: '00:00:05,000' } });
    fireEvent.blur(startInput);
    expect(onChangeStart).toHaveBeenCalledWith(0, 5000);
  });

  it('calls onChangeEnd with parsed ms on blur of end time input', () => {
    const onChangeEnd = jest.fn();
    renderComponent({ onChangeEnd, endMs: 1500 });
    const endInput = screen.getByLabelText('End time');
    fireEvent.change(endInput, { target: { value: '00:00:03,000' } });
    fireEvent.blur(endInput);
    expect(onChangeEnd).toHaveBeenCalledWith(0, 3000);
  });

  it('marks time input as invalid when invalid timestamp is entered', () => {
    renderComponent({ startMs: 0 });
    const startInput = screen.getByLabelText('Start time');
    fireEvent.change(startInput, { target: { value: 'not-a-time' } });
    act(() => {
      fireEvent.blur(startInput);
    });
    expect(startInput).toHaveClass('is-invalid');
  });

  it('commits start time on Enter key', () => {
    const onChangeStart = jest.fn();
    renderComponent({ onChangeStart, startMs: 0 });
    const startInput = screen.getByLabelText('Start time');
    fireEvent.change(startInput, { target: { value: '00:00:10,000' } });
    fireEvent.keyDown(startInput, { key: 'Enter' });
    fireEvent.blur(startInput);
    expect(onChangeStart).toHaveBeenCalledWith(0, 10000);
  });

  it('prevents non-numeric/non-separator characters in time input', () => {
    renderComponent({ startMs: 0 });
    const startInput = screen.getByLabelText('Start time');
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
    act(() => {
      startInput.dispatchEvent(event);
    });
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
