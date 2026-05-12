import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Button, Form, Icon, IconButton, Stack,
} from '@openedx/paragon';
import { PlayArrow, DeleteOutline, Add } from '@openedx/paragon/icons';

import { formatBlockTimestamp, msToSrtTime, srtTimeToMs } from './srtUtils';
import messages from './messages';

const TimeInput = ({ valueMs, onCommit, ariaLabel }) => {
  const [draft, setDraft] = useState(msToSrtTime(valueMs));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(msToSrtTime(valueMs));
    setInvalid(false);
  }, [valueMs]);

  const commit = () => {
    const ms = srtTimeToMs(draft);
    if (ms == null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onCommit(ms);
  };

  return (
    <Form.Control
      type="text"
      size="sm"
      controlClassName={`transcript-cue-block__time-input${invalid ? ' is-invalid' : ''}`}
      value={draft}
      onChange={(e) => {
        const filtered = e.target.value.replace(/[^0-9:,.]/g, '');
        setDraft(filtered);
        setInvalid(false);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.target.blur(); return; }
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
          'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End', 'Escape'];
        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
          return;
        }
        if (!/^[0-9:,.]$/.test(e.key)) {
          e.preventDefault();
        }
      }}
      aria-label={ariaLabel}
      spellCheck={false}
      inputMode="numeric"
    />
  );
};

TimeInput.propTypes = {
  valueMs: PropTypes.number.isRequired,
  onCommit: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

const TranscriptCueBlock = React.forwardRef(({
  index,
  startMs,
  endMs,
  text,
  onChange,
  onChangeStart,
  onChangeEnd,
  onSeek,
  onDelete,
  onInsertAfter,
  isActive,
  isLast,
  errors,
}, ref) => {
  const intl = useIntl();
  const textareaRef = useRef(null);
  const timestamp = formatBlockTimestamp(startMs);

  const handleTextChange = React.useCallback((e) => onChange(index, e.target.value), [index, onChange]);
  const handleStartCommit = React.useCallback((ms) => onChangeStart(index, ms), [index, onChangeStart]);
  const handleEndCommit = React.useCallback((ms) => onChangeEnd(index, ms), [index, onChangeEnd]);
  const handleSeekClick = React.useCallback(() => { if (onSeek) { onSeek(startMs); } }, [onSeek, startMs]);
  const handleDeleteClick = React.useCallback(() => onDelete(index), [index, onDelete]);
  const handleInsertClick = React.useCallback(() => onInsertAfter(index), [index, onInsertAfter]);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) { return; }
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [text]);

  return (
    <Stack className="transcript-cue-block-row position-relative">
      <Stack
        direction="horizontal"
        ref={ref}
        className={`transcript-cue-block position-relative mb-2 rounded-2 bg-transparent align-items-center${isActive ? ' transcript-cue-block--active' : ''}${errors && errors.length ? ' transcript-cue-block--invalid' : ''}`}
      >
        <Stack className="transcript-cue-block__textarea-wrap pe-3 align-self-center">
          <Form.Control
            as="textarea"
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onInput={autoGrow}
            aria-label={intl.formatMessage(messages.cueAriaLabel, { timestamp })}
            aria-invalid={errors && errors.length > 0 ? 'true' : 'false'}
            rows={1}
            controlClassName={`transcript-cue-block__textarea${errors && errors.length ? ' transcript-cue-block__textarea--invalid' : ''}`}
            spellCheck
          />
          {errors && errors.length > 0 && (
            <Stack className="transcript-cue-block__errors" role="alert">
              {errors.map((msg) => (
                <Form.Control.Feedback
                  key={msg}
                  type="invalid"
                  className="transcript-cue-block__error-row"
                >
                  {msg}
                </Form.Control.Feedback>
              ))}
            </Stack>
          )}
        </Stack>
        <Stack direction="horizontal" className="transcript-cue-block__controls align-items-center flex-shrink-0 flex-nowrap gap-2">
          <Stack direction="horizontal" className="transcript-cue-block__times align-items-center flex-nowrap gap-1">
            <TimeInput
              valueMs={startMs}
              onCommit={handleStartCommit}
              ariaLabel={intl.formatMessage(messages.startTimeLabel)}
            />
            <span className="transcript-cue-block__time-separator mr-2">→</span>
            <TimeInput
              valueMs={endMs}
              onCommit={handleEndCommit}
              ariaLabel={intl.formatMessage(messages.endTimeLabel)}
            />
          </Stack>
          <Stack direction="horizontal" className="transcript-cue-block__actions align-items-center gap-1">
            <IconButton
              src={PlayArrow}
              iconAs={Icon}
              size="sm"
              alt={intl.formatMessage(messages.seekTooltip, { timestamp })}
              onClick={handleSeekClick}
            />
            <IconButton
              src={DeleteOutline}
              iconAs={Icon}
              size="sm"
              alt={intl.formatMessage(messages.deleteCueLabel)}
              onClick={handleDeleteClick}
            />
          </Stack>
        </Stack>
      </Stack>
      {!isLast && (
        <Stack className="transcript-cue-block__insert justify-content-center align-items-center position-relative">
          <Button
            variant="outline-primary"
            size="sm"
            className="transcript-cue-block__insert-btn"
            onClick={handleInsertClick}
            title={intl.formatMessage(messages.insertCueLabel)}
            iconBefore={Add}
          >
            {intl.formatMessage(messages.insertCueLabel)}
          </Button>
        </Stack>
      )}
    </Stack>
  );
});

TranscriptCueBlock.displayName = 'TranscriptCueBlock';

TranscriptCueBlock.propTypes = {
  index: PropTypes.number.isRequired,
  startMs: PropTypes.number.isRequired,
  endMs: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onChangeStart: PropTypes.func.isRequired,
  onChangeEnd: PropTypes.func.isRequired,
  onSeek: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
  onInsertAfter: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  isLast: PropTypes.bool,
  errors: PropTypes.arrayOf(PropTypes.string),
};

TranscriptCueBlock.defaultProps = {
  onSeek: null,
  isActive: false,
  isLast: false,
  errors: [],
};

const arePropsEqual = (a, b) => (
  a.index === b.index
  && a.startMs === b.startMs
  && a.endMs === b.endMs
  && a.text === b.text
  && a.isActive === b.isActive
  && a.isLast === b.isLast
  && a.errors === b.errors
  && a.onChange === b.onChange
  && a.onChangeStart === b.onChangeStart
  && a.onChangeEnd === b.onChangeEnd
  && a.onSeek === b.onSeek
  && a.onDelete === b.onDelete
  && a.onInsertAfter === b.onInsertAfter
);

export default React.memo(TranscriptCueBlock, arePropsEqual);
