import React, {
  startTransition,
  useCallback, useDeferredValue, useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  ModalDialog,
  Spinner,
  Stack,
  Icon,
  Button,
  ActionRow,
  AlertModal,
  useToggle,
} from '@openedx/paragon';
import { Sync, CheckCircle, Add } from '@openedx/paragon/icons';

import { fetchTranscriptText, uploadTranscript } from '../data/api';
import { parseSrt, serializeSrt, validateCues } from './srtUtils';
import TranscriptCueBlock from './TranscriptCueBlock';
import messages from './messages';

function useTranscriptSave({
  videoId,
  language,
  apiUrl,
  filename,
  saveFailedMessage = 'Save failed',
}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const inFlightRef = useRef(0);

  const save = useCallback(async (content) => {
    const requestId = inFlightRef.current + 1;
    inFlightRef.current = requestId;
    setStatus('saving');
    setError(null);
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], filename || `${language}.srt`, { type: 'text/plain' });
      await uploadTranscript({
        videoId, language, newLanguage: language, file, apiUrl,
      });
      if (inFlightRef.current === requestId) {
        setStatus('saved');
      }
      return true;
    } catch (err) {
      if (inFlightRef.current === requestId) {
        setStatus('error');
        setError(
          err?.response?.data?.detail
          || err?.response?.data?.error
          || err?.message
          || saveFailedMessage,
        );
      }
      return false;
    }
  }, [videoId, language, apiUrl, filename, saveFailedMessage]);

  const reset = useCallback(() => {
    inFlightRef.current += 1;
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status, error, save, reset,
  };
}

const CUE_ERROR_MESSAGES = {
  empty: messages.cueErrorEmpty,
  blankLine: messages.cueErrorBlankLine,
  looksLikeIndex: messages.cueErrorLooksLikeIndex,
  looksLikeTimestamp: messages.cueErrorLooksLikeTimestamp,
  endBeforeStart: messages.cueErrorEndBeforeStart,
};

const TranscriptEditorModal = ({
  isOpen,
  onClose,
  courseName,
  videoId,
  videoFilename,
  videoSrc,
  language,
  languageName,
  transcriptDownloadHandlerUrl,
  transcriptUploadHandlerUrl,
}) => {
  const intl = useIntl();
  const [isDiscardConfirmOpen, openDiscardConfirm, closeDiscardConfirm] = useToggle(false);
  const videoRef = useRef(null);
  const textTrackRef = useRef(null);
  const cueNodeRefs = useRef([]);
  const cueRefSettersRef = useRef(new Map());
  const cueListRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimerRef = useRef(null);
  const lastTimeUpdateRef = useRef(0);
  const [cues, setCues] = useState([]);
  const [loadStatus, setLoadStatus] = useState('idle'); // idle|loading|loaded|error
  const [hasEdited, setHasEdited] = useState(false);
  const [activeCueIdx, setActiveCueIdx] = useState(-1);

  useEffect(() => {
    if (!isOpen) { return () => {}; }
    let cancelled = false;
    setLoadStatus('loading');
    setHasEdited(false);
    (async () => {
      try {
        const text = await fetchTranscriptText({
          videoId,
          language,
          apiUrl: transcriptDownloadHandlerUrl,
        });
        if (cancelled) { return; }
        await new Promise((r) => { setTimeout(r, 0); });
        if (cancelled) { return; }
        const parsed = parseSrt(text);
        if (cancelled) { return; }
        setCues(parsed);
        setLoadStatus('loaded');
      } catch (err) {
        if (!cancelled) { setLoadStatus('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, videoId, language, transcriptDownloadHandlerUrl]);

  const deferredCues = useDeferredValue(cues);
  // Skip the per-cue validation pass for very large transcripts — it is O(n)
  // and runs synchronously in render; on a 25 MB / 50k+ cue file it's the
  // single biggest source of the "open modal then scroll freezes" stall.
  // Authors get validation feedback for normal-sized files; huge files still
  // save fine.
  const VALIDATION_LIMIT = 2000;
  const validationIssues = useMemo(
    () => (deferredCues.length > VALIDATION_LIMIT ? [] : validateCues(deferredCues)),
    [deferredCues],
  );
  const issuesByCue = useMemo(() => {
    const m = new Map();
    validationIssues.forEach((iss) => {
      if (!m.has(iss.i)) { m.set(iss.i, []); }
      m.get(iss.i).push(iss);
    });
    return m;
  }, [validationIssues]);
  const hasValidationErrors = validationIssues.length > 0;

  const {
    status: saveStatus, error: saveError, save: saveTranscript, reset: resetSaveStatus,
  } = useTranscriptSave({
    videoId,
    language,
    apiUrl: transcriptUploadHandlerUrl,
    filename: `${videoFilename || videoId}-${language}.srt`,
    saveFailedMessage: intl.formatMessage(messages.saveFailed),
  });

  useEffect(() => {
    if (!isOpen) { resetSaveStatus(); }
  }, [isOpen, resetSaveStatus]);

  const saveStatusRef = useRef(saveStatus);
  useEffect(() => { saveStatusRef.current = saveStatus; }, [saveStatus]);

  const markEdited = useCallback(() => {
    setHasEdited(true);
    const s = saveStatusRef.current;
    if (s !== 'idle' && s !== 'saving') { resetSaveStatus(); }
  }, [resetSaveStatus]);

  const updateCueText = useCallback((i, nextText) => {
    setCues((prev) => prev.map((c, idx) => (idx === i ? { ...c, text: nextText } : c)));
    markEdited();
  }, [markEdited]);

  const updateCueTime = useCallback((i, field, ms) => {
    setCues((prev) => prev.map((c, idx) => {
      if (idx !== i) { return c; }
      const { startText, endText, ...rest } = c;
      return { ...rest, [field]: ms };
    }));
    markEdited();
  }, [markEdited]);

  const deleteCue = useCallback((i) => {
    setCues((prev) => prev.filter((_, idx) => idx !== i));
    markEdited();
  }, [markEdited]);

  const insertCueAt = useCallback((i) => {
    setCues((prev) => {
      const before = prev[i];
      const after = prev[i + 1];
      let newStart;
      let newEnd;
      if (after) {
        const mid = Math.floor(((before?.endMs ?? 0) + after.startMs) / 2);
        newStart = before ? Math.max(before.endMs, mid - 1000) : mid - 1000;
        newEnd = Math.min(after.startMs - 1, newStart + 2000);
      } else {
        newStart = (before?.endMs ?? 0) + 100;
        newEnd = newStart + 2000;
      }
      const newCue = {
        index: (before?.index ?? 0) + 1,
        startMs: Math.max(0, newStart),
        endMs: Math.max(newStart + 100, newEnd),
        text: '',
      };
      const next = [...prev];
      next.splice(i + 1, 0, newCue);
      return next;
    });
    markEdited();
  }, [markEdited]);

  const appendCue = useCallback(() => {
    setCues((prev) => {
      const last = prev[prev.length - 1];
      const start = last ? last.endMs + 100 : 0;
      return [...prev, {
        index: (last?.index ?? 0) + 1,
        startMs: start,
        endMs: start + 2000,
        text: '',
      }];
    });
    markEdited();
  }, [markEdited]);

  const handleSave = async () => {
    const ok = await saveTranscript(serializeSrt(cues));
    if (ok) { setHasEdited(false); }
  };

  const handleCancel = () => {
    if (hasEdited && saveStatus !== 'saving') {
      openDiscardConfirm();
      return;
    }
    onClose();
  };

  const handleDiscardConfirmed = () => {
    closeDiscardConfirm();
    onClose();
  };

  const updateCueStart = useCallback((i, ms) => updateCueTime(i, 'startMs', ms), [updateCueTime]);
  const updateCueEnd = useCallback((i, ms) => updateCueTime(i, 'endMs', ms), [updateCueTime]);

  const formattedErrorsByCue = useMemo(() => {
    const m = new Map();
    issuesByCue.forEach((issues, idx) => {
      m.set(idx, issues.map((iss) => (
        CUE_ERROR_MESSAGES[iss.code]
          ? intl.formatMessage(CUE_ERROR_MESSAGES[iss.code])
          : iss.code
      )));
    });
    return m;
  }, [issuesByCue, intl]);
  const EMPTY_ERRORS = useMemo(() => [], []);
  // Mounting many cue blocks at once is the dominant cost when first opening a
  // long transcript. Start with a small batch so the modal becomes scrollable
  // immediately, then extend in tiny chunks via setTimeout(0) (yields to the
  // browser between batches so scroll/input stay responsive).
  const INITIAL_REVEAL = 30;
  const REVEAL_CHUNK = 60;
  const [revealCount, setRevealCount] = useState(INITIAL_REVEAL);

  // Reset when a fresh transcript is loaded.
  useEffect(() => {
    setRevealCount(INITIAL_REVEAL);
  }, [cues]);

  useEffect(() => {
    if (loadStatus !== 'loaded' || cues.length <= INITIAL_REVEAL) {
      return undefined;
    }
    let cancelled = false;
    let timerId = 0;

    const tick = () => {
      if (cancelled) { return; }
      // startTransition lets React interrupt this low-priority update if the
      // user starts scrolling/typing.
      startTransition(() => {
        setRevealCount((prev) => {
          if (prev >= cues.length) { return prev; }
          return Math.min(prev + REVEAL_CHUNK, cues.length);
        });
      });
      timerId = window.setTimeout(tick, 32);
    };

    timerId = window.setTimeout(tick, 32);
    return () => { cancelled = true; window.clearTimeout(timerId); };
  }, [loadStatus, cues]);

  const visibleCueCount = Math.min(revealCount, cues.length);

  const seekToMs = useCallback((ms) => {
    const el = videoRef.current;
    if (el) {
      el.currentTime = ms / 1000;
      el.play().catch(() => {});
    }
  }, []);

  const deferredTrackCues = useDeferredValue(cues);
  useEffect(() => {
    if (loadStatus !== 'loaded') { return undefined; }
    const video = videoRef.current;
    if (!video) { return undefined; }

    // The browser's WebVTT engine slows down sharply past a few thousand cues
    // and adding tens of thousands chokes the main thread for seconds even when
    // chunked. For very long transcripts, skip the burned-in subtitle track —
    // the cue list itself is the editing surface, and the user can still seek
    // via the play buttons.
    const VTT_LIMIT = 2000;
    if (deferredTrackCues.length > VTT_LIMIT) { return undefined; }

    let cancelled = false;
    let rafId = 0;
    let idleId = 0;
    const cancelAll = () => {
      cancelled = true;
      if (rafId) { cancelAnimationFrame(rafId); }
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };

    const start = () => {
      if (cancelled) { return; }
      let track = Array.from(video.textTracks)
        .find((t) => t.kind === 'subtitles' && t.language === language);
      if (!track) {
        track = video.addTextTrack('subtitles', languageName || language, language);
        textTrackRef.current = track;
      }
      track.mode = 'showing';

      const existing = Array.from(track.cues || []);
      let removeI = 0;
      const CHUNK = 500;

      const addCues = (addI) => {
        if (cancelled) { return; }
        const end = Math.min(addI + CHUNK, deferredTrackCues.length);
        for (let i = addI; i < end; i += 1) {
          const cue = deferredTrackCues[i];
          try {
            track.addCue(new VTTCue(cue.startMs / 1000, cue.endMs / 1000, cue.text));
          } catch (e) { /* browser may reject overlapping cues */ }
        }
        if (end < deferredTrackCues.length) {
          rafId = requestAnimationFrame(() => addCues(end));
        }
      };

      const removeChunk = () => {
        if (cancelled) { return; }
        const end = Math.min(removeI + CHUNK, existing.length);
        for (let i = removeI; i < end; i += 1) {
          try { track.removeCue(existing[i]); } catch (e) { /* ignore */ }
        }
        removeI = end;
        if (removeI < existing.length) {
          rafId = requestAnimationFrame(removeChunk);
        } else {
          rafId = requestAnimationFrame(() => addCues(0));
        }
      };
      removeChunk();
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: 1500 });
    } else {
      const timer = setTimeout(start, 300);
      return () => { cancelled = true; clearTimeout(timer); };
    }
    return cancelAll;
  }, [deferredTrackCues, loadStatus, language, languageName]);

  useEffect(() => {
    textTrackRef.current = null;
  }, [videoId, language]);

  const findActiveCueIdx = useCallback((currentMs) => {
    const arr = cues;
    let lo = 0;
    let hi = arr.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const c = arr[mid];
      if (currentMs < c.startMs) { hi = mid - 1; } else if (currentMs >= c.endMs) { lo = mid + 1; } else { return mid; }
    }
    return -1;
  }, [cues]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) { return undefined; }
    const handleTimeUpdate = () => {
      const now = performance.now();
      if (now - lastTimeUpdateRef.current < 250) { return; }
      lastTimeUpdateRef.current = now;
      const currentMs = video.currentTime * 1000;
      const idx = findActiveCueIdx(currentMs);
      setActiveCueIdx((prev) => (prev === idx ? prev : idx));
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [findActiveCueIdx]);

  useEffect(() => {
    if (isUserScrollingRef.current) { return; }
    if (activeCueIdx < 0) { return; }
    const cueEl = cueNodeRefs.current[activeCueIdx];
    const listEl = cueListRef.current;
    if (!cueEl || !listEl) { return; }

    const listRect = listEl.getBoundingClientRect();
    const cueRect = cueEl.getBoundingClientRect();

    const margin = 24;
    if (cueRect.top >= listRect.top + margin && cueRect.bottom <= listRect.bottom - margin) {
      return;
    }

    const cueCenterRelative = cueRect.top - listRect.top + listEl.scrollTop + cueRect.height / 2;
    const targetScrollTop = cueCenterRelative - listRect.height / 2;
    listEl.scrollTop = Math.max(0, targetScrollTop);
  }, [activeCueIdx]);

  const handleCueListScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    clearTimeout(userScrollTimerRef.current);
    userScrollTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 1500);
  }, []);

  const getCueNodeRefSetter = useCallback((index) => {
    const cache = cueRefSettersRef.current;
    let setter = cache.get(index);
    if (!setter) {
      setter = (el) => { cueNodeRefs.current[index] = el; };
      cache.set(index, setter);
    }
    return setter;
  }, []);

  const renderHeaderStatus = () => {
    if (saveStatus === 'saving') {
      return (
        <span className="text-muted small d-inline-flex align-items-center align-self-end">
          <Icon src={Sync} size="inline" className="mr-1" />
          {intl.formatMessage(messages.statusSaving)}
        </span>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <span className="small d-inline-flex align-items-center transcript-editor-modal__status--saved align-self-end">
          <Icon src={CheckCircle} size="inline" className="mr-1 transcript-editor-modal__status--saved" />
          {intl.formatMessage(messages.statusSaved)}
        </span>
      );
    }
    if (saveStatus === 'error') {
      return (
        <span className="text-danger small align-self-end">
          {intl.formatMessage(messages.statusError, { detail: saveError || '' })}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <AlertModal
        title={intl.formatMessage(messages.confirmDiscardTitle)}
        isOpen={isDiscardConfirmOpen}
        onClose={closeDiscardConfirm}
        variant="warning"
        footerNode={(
          <ActionRow>
            <Button variant="tertiary" onClick={closeDiscardConfirm}>
              {intl.formatMessage(messages.cancelLabel)}
            </Button>
            <Button variant="danger" onClick={handleDiscardConfirmed}>
              {intl.formatMessage(messages.confirmDiscardLabel)}
            </Button>
          </ActionRow>
        )}
      >
        <p>{intl.formatMessage(messages.confirmDiscardChanges)}</p>
      </AlertModal>
      <ModalDialog
        title={intl.formatMessage(messages.modalTitle)}
        isOpen={isOpen}
        onClose={handleCancel}
        size="lg"
        hasCloseButton
        className="transcript-editor-modal"
      >
        <ModalDialog.Header>
          <Stack direction="horizontal" gap={3} className="transcript-editor-modal__header w-100 align-items-baseline">
            <ModalDialog.Title className="transcript-editor-modal__title">
              <Stack className="transcript-editor-modal__course text-truncate">{courseName || ''}</Stack>
              <Stack className="transcript-editor-modal__filename text-truncate">{videoFilename}</Stack>
              {languageName && (
              <Stack className="transcript-editor-modal__language text-truncate fw-semibold">{languageName}</Stack>
              )}
            </ModalDialog.Title>
            <Stack className="transcript-editor-modal__status ms-auto me-4 flex-shrink-0 text-nowrap">{renderHeaderStatus()}</Stack>
          </Stack>
        </ModalDialog.Header>
        <ModalDialog.Body className="transcript-editor-modal__body">
          <Stack className="transcript-editor-modal__sticky-video flex-shrink-0">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                className="transcript-editor-modal__video d-block"
                style={cues.length <= 1 ? {} : { maxHeight: '38vh' }}
              >
                <track kind="captions" label={languageName || language} default />
              </video>
            ) : (
              <Stack className="text-muted small p-3">
                {intl.formatMessage(messages.videoUnavailable)}
              </Stack>
            )}
          </Stack>
          <Stack className="transcript-editor-modal__cue-list-wrapper overflow-hidden">
            <Stack
              ref={cueListRef}
              className="transcript-editor-modal__cue-list"
              onScroll={handleCueListScroll}
            >
              <Stack className="transcript-editor-modal__cue-list-inner">
                {loadStatus === 'loading' && (
                <Stack direction="horizontal" className="align-items-center text-muted">
                  <Spinner
                    animation="border"
                    size="sm"
                    screenReaderText={intl.formatMessage(messages.loading)}
                    className="mr-2"
                  />
                    {intl.formatMessage(messages.loading)}
                </Stack>
                )}
                {loadStatus === 'error' && (
                <Stack className="text-danger small">{intl.formatMessage(messages.loadError)}</Stack>
                )}
                {loadStatus === 'loaded' && cues.length === 0 && (
                <Stack className="transcript-editor-modal__empty-state align-items-center text-center text-muted py-4">
                  <Stack className="transcript-editor-modal__empty-state-title fw-semibold">
                    {intl.formatMessage(messages.emptyStateTitle)}
                  </Stack>
                  <Stack className="transcript-editor-modal__empty-state-description small mt-1">
                    {intl.formatMessage(messages.emptyStateDescription)}
                  </Stack>
                </Stack>
                )}
                {loadStatus === 'loaded' && cues.slice(0, visibleCueCount).map((cue, i) => (
                  <TranscriptCueBlock
                    key={`${cue.index}-${cue.startMs}`}
                    ref={getCueNodeRefSetter(i)}
                    index={i}
                    startMs={cue.startMs}
                    endMs={cue.endMs}
                    text={cue.text}
                    onChange={updateCueText}
                    onChangeStart={updateCueStart}
                    onChangeEnd={updateCueEnd}
                    onSeek={seekToMs}
                    onDelete={deleteCue}
                    onInsertAfter={insertCueAt}
                    isActive={i === activeCueIdx}
                    isLast={i === cues.length - 1}
                    errors={formattedErrorsByCue.get(i) || EMPTY_ERRORS}
                  />
                ))}
                {loadStatus === 'loaded' && (
                <Button
                  variant="outline-primary"
                  className="transcript-editor-modal__append-btn mt-2"
                  onClick={appendCue}
                  iconBefore={Add}
                  block
                >
                  {intl.formatMessage(messages.appendCueLabel)}
                </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <ActionRow>
            <Button
              variant="tertiary"
              onClick={handleCancel}
              disabled={saveStatus === 'saving'}
            >
              {intl.formatMessage(messages.cancelLabel)}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
              !hasEdited
              || saveStatus === 'saving'
              || loadStatus !== 'loaded'
              || hasValidationErrors
              || cues.length === 0
            }
            >
              {saveStatus === 'saving'
                ? intl.formatMessage(messages.statusSaving)
                : intl.formatMessage(messages.saveLabel)}
            </Button>
          </ActionRow>
        </ModalDialog.Footer>
      </ModalDialog>
    </>
  );
};

TranscriptEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  courseName: PropTypes.string,
  videoId: PropTypes.string.isRequired,
  videoFilename: PropTypes.string.isRequired,
  videoSrc: PropTypes.string,
  language: PropTypes.string.isRequired,
  languageName: PropTypes.string,
  transcriptDownloadHandlerUrl: PropTypes.string.isRequired,
  transcriptUploadHandlerUrl: PropTypes.string.isRequired,
};

TranscriptEditorModal.defaultProps = {
  courseName: '',
  videoSrc: '',
  languageName: '',
};

export default TranscriptEditorModal;
