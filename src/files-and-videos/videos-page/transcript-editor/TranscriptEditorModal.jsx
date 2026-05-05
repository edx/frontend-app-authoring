import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import {
  ModalDialog,
  Spinner,
  Stack,
  Icon,
} from '@openedx/paragon';
import { Sync, CheckCircle, Add } from '@openedx/paragon/icons';

import { getApiBaseUrl, uploadTranscript } from '../data/api';
import { parseSrt, serializeSrt, validateCues } from './srtUtils';
import TranscriptCueBlock from './TranscriptCueBlock';
import messages from './messages';

function useTranscriptAutoSave({
  videoId,
  language,
  content,
  apiUrl,
  filename,
  enabled = true,
  debounceMs = 1500,
}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const lastSavedRef = useRef(content);
  const inFlightRef = useRef(0);

  const flush = useCallback(async (next) => {
    const requestId = inFlightRef.current + 1;
    inFlightRef.current = requestId;
    setStatus('saving');
    setError(null);
    try {
      const blob = new Blob([next], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], filename || `${language}.srt`, { type: 'text/plain' });
      await uploadTranscript({
        videoId, language, newLanguage: language, file, apiUrl,
      });
      if (inFlightRef.current === requestId) {
        lastSavedRef.current = next;
        setStatus('saved');
      }
    } catch (err) {
      if (inFlightRef.current === requestId) {
        setStatus('error');
        setError(
          err?.response?.data?.detail
          || err?.response?.data?.error
          || err?.message
          || 'Save failed',
        );
      }
    }
  }, [videoId, language, apiUrl, filename]);

  useEffect(() => {
    if (!enabled) { return undefined; }
    if (content === lastSavedRef.current) { return undefined; }
    if (timerRef.current) { clearTimeout(timerRef.current); }
    timerRef.current = setTimeout(() => { flush(content); }, debounceMs);
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); }
    };
  }, [content, enabled, debounceMs, flush]);

  return { status, error };
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
  const videoRef = useRef(null);
  const textTrackRef = useRef(null);
  const cueNodeRefs = useRef([]);
  const cueListRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimerRef = useRef(null);
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
        const url = `${getApiBaseUrl()}${transcriptDownloadHandlerUrl}`
          + `?edx_video_id=${encodeURIComponent(videoId)}`
          + `&language_code=${encodeURIComponent(language)}`;
        const { data } = await getAuthenticatedHttpClient().get(url, {
          responseType: 'text',
          transformResponse: (v) => v,
        });
        if (cancelled) { return; }
        const text = typeof data === 'string' ? data : String(data ?? '');
        setCues(parseSrt(text));
        setLoadStatus('loaded');
      } catch (err) {
        if (!cancelled) { setLoadStatus('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, videoId, language, transcriptDownloadHandlerUrl]);

  const serialized = useMemo(() => serializeSrt(cues), [cues]);
  const validationIssues = useMemo(() => validateCues(cues), [cues]);
  const issuesByCue = useMemo(() => {
    const m = new Map();
    validationIssues.forEach((iss) => {
      if (!m.has(iss.i)) { m.set(iss.i, []); }
      m.get(iss.i).push(iss);
    });
    return m;
  }, [validationIssues]);
  const hasValidationErrors = validationIssues.length > 0;

  const { status: saveStatus, error: saveError } = useTranscriptAutoSave({
    videoId,
    language,
    content: serialized,
    apiUrl: transcriptUploadHandlerUrl,
    filename: `${videoFilename || videoId}-${language}.srt`,
    enabled: isOpen && hasEdited && loadStatus === 'loaded' && !hasValidationErrors,
  });

  const updateCueText = (i, nextText) => {
    setCues((prev) => prev.map((c, idx) => (idx === i ? { ...c, text: nextText } : c)));
    setHasEdited(true);
  };

  const updateCueTime = (i, field, ms) => {
    setCues((prev) => prev.map((c, idx) => {
      if (idx !== i) { return c; }
      const { startText, endText, ...rest } = c;
      return { ...rest, [field]: ms };
    }));
    setHasEdited(true);
  };

  const deleteCue = (i) => {
    setCues((prev) => prev.filter((_, idx) => idx !== i));
    setHasEdited(true);
  };

  const insertCueAt = (i) => {
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
    setHasEdited(true);
  };

  const appendCue = () => {
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
    setHasEdited(true);
  };

  const seekToMs = (ms) => {
    const el = videoRef.current;
    if (el) {
      el.currentTime = ms / 1000;
      el.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (loadStatus !== 'loaded') { return; }
    const video = videoRef.current;
    if (!video) { return; }

    let track = Array.from(video.textTracks)
      .find((t) => t.kind === 'subtitles' && t.language === language);
    if (!track) {
      track = video.addTextTrack('subtitles', languageName || language, language);
      textTrackRef.current = track;
    }
    track.mode = 'showing';

    Array.from(track.cues || []).forEach((c) => track.removeCue(c));
    cues.forEach((cue) => {
      try {
        track.addCue(new VTTCue(cue.startMs / 1000, cue.endMs / 1000, cue.text));
      } catch (e) { /* browser may reject overlapping cues */ }
    });
  }, [cues, loadStatus, language, languageName]);

  useEffect(() => {
    textTrackRef.current = null;
  }, [videoId, language]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) { return undefined; }
    const handleTimeUpdate = () => {
      const currentMs = video.currentTime * 1000;
      const idx = cues.findIndex((c) => currentMs >= c.startMs && currentMs < c.endMs);
      setActiveCueIdx(idx);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [cues]);

  useEffect(() => {
    if (isUserScrollingRef.current) { return; }
    const cueEl = activeCueIdx >= 0 ? cueNodeRefs.current[activeCueIdx] : null;
    const listEl = cueListRef.current;
    if (!cueEl || !listEl) { return; }

    const listRect = listEl.getBoundingClientRect();
    const cueRect = cueEl.getBoundingClientRect();

    const cueCenterRelative = cueRect.top - listRect.top + listEl.scrollTop + cueRect.height / 2;
    const targetScrollTop = cueCenterRelative - listRect.height / 2;

    listEl.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
  }, [activeCueIdx]);

  const handleCueListScroll = () => {
    isUserScrollingRef.current = true;
    clearTimeout(userScrollTimerRef.current);
    userScrollTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 2000);
  };

  const renderHeaderStatus = () => {
    if (saveStatus === 'saving') {
      return (
        <span className="text-muted small d-inline-flex align-items-center">
          <Icon src={Sync} size="inline" className="mr-1" />
          {intl.formatMessage(messages.statusSaving)}
        </span>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <span className="small d-inline-flex align-items-center transcript-editor-modal__status--saved">
          <Icon src={CheckCircle} size="inline" className="mr-1 transcript-editor-modal__status--saved" />
          {intl.formatMessage(messages.statusSaved)}
        </span>
      );
    }
    if (saveStatus === 'error') {
      return (
        <span className="text-danger small">
          {intl.formatMessage(messages.statusError, { detail: saveError || '' })}
        </span>
      );
    }
    return null;
  };

  return (
    <ModalDialog
      title={intl.formatMessage(messages.modalTitle)}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      hasCloseButton
      className="transcript-editor-modal"
    >
      <ModalDialog.Header>
        <Stack direction="horizontal" gap={3} className="transcript-editor-modal__header">
          <ModalDialog.Title className="transcript-editor-modal__title">
            <div className="transcript-editor-modal__course">{courseName || ''}</div>
            <div className="transcript-editor-modal__filename">{videoFilename}</div>
            {languageName && (
              <div className="transcript-editor-modal__language">{languageName}</div>
            )}
          </ModalDialog.Title>
          <div className="transcript-editor-modal__status">{renderHeaderStatus()}</div>
        </Stack>
      </ModalDialog.Header>
      <ModalDialog.Body className="transcript-editor-modal__body">
        <div className="transcript-editor-modal__sticky-video">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="transcript-editor-modal__video"
            >
              <track kind="captions" label={languageName || language} default />
            </video>
          ) : (
            <div className="text-muted small p-3">
              {intl.formatMessage(messages.videoUnavailable)}
            </div>
          )}
        </div>
        <div className="transcript-editor-modal__cue-list-wrapper">
          <div
            ref={cueListRef}
            className="transcript-editor-modal__cue-list"
            onScroll={handleCueListScroll}
          >
            <div className="transcript-editor-modal__cue-list-inner">
              {loadStatus === 'loading' && (
                <div className="d-flex align-items-center text-muted">
                  <Spinner animation="border" size="sm" screenReaderText="" className="mr-2" />
                  {intl.formatMessage(messages.loading)}
                </div>
              )}
              {loadStatus === 'error' && (
                <div className="text-danger small">{intl.formatMessage(messages.loadError)}</div>
              )}
              {loadStatus === 'loaded' && cues.map((cue, i) => (
                <TranscriptCueBlock
                  key={`${cue.index}-${cue.startMs}`}
                  ref={(el) => { cueNodeRefs.current[i] = el; }}
                  startMs={cue.startMs}
                  endMs={cue.endMs}
                  text={cue.text}
                  onChange={(next) => updateCueText(i, next)}
                  onChangeStart={(ms) => updateCueTime(i, 'startMs', ms)}
                  onChangeEnd={(ms) => updateCueTime(i, 'endMs', ms)}
                  onSeek={seekToMs}
                  onDelete={() => deleteCue(i)}
                  onInsertAfter={() => insertCueAt(i)}
                  isActive={i === activeCueIdx}
                  errors={(issuesByCue.get(i) || []).map((iss) => (
                    CUE_ERROR_MESSAGES[iss.code]
                      ? intl.formatMessage(CUE_ERROR_MESSAGES[iss.code])
                      : iss.code
                  ))}
                />
              ))}
              {loadStatus === 'loaded' && (
                <button
                  type="button"
                  className="transcript-editor-modal__append-btn"
                  onClick={appendCue}
                >
                  <Icon src={Add} size="inline" className="mr-1" />
                  <span>{intl.formatMessage(messages.appendCueLabel)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </ModalDialog.Body>
    </ModalDialog>
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
