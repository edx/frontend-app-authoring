import React from 'react';
import { useDispatch } from 'react-redux';

import { thunkActions } from '../../../../../../data/redux';

// This 'module' self-import hack enables mocking during tests.
// See src/editors/decisions/0005-internal-editor-testability-decisions.md.
// eslint-disable-next-line import/no-self-import
import * as module from './hooks';

// 500 MB — must match the backend MAX_BYTES.
export const MAX_BYTES = 500 * 1024 * 1024;

// Allowed audio file extensions and MIME types. Mirrors the backend
// VIDEO_AUDIO_DESCRIPTION_SETTINGS['ALLOWED_CONTENT_TYPES'].
export const ALLOWED_EXTENSIONS = '.mp3,.m4a,.wav,.aac';
export const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
]);

export const parseFileName = (audioDescription) => {
  if (!audioDescription) {
    return null;
  }
  // The backend stores the user-supplied filename verbatim, so just trim
  // any leading directory components in case something else slipped through.
  const lastSlash = audioDescription.lastIndexOf('/');
  return lastSlash >= 0 ? audioDescription.slice(lastSlash + 1) : audioDescription;
};

/**
 * Convert seconds to "HH:MM:SS" or "MM:SS" depending on length. Used for the
 * duration-mismatch warning message.
 */
export const formatDuration = (seconds) => {
  if (seconds == null || Number.isNaN(seconds)) { return '?'; }
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
};

/**
 * Read the duration of an audio file using a hidden <audio> element. The
 * browser only fetches the file *header* (a few KB) for `loadedmetadata`,
 * so this is safe to run on hundreds-of-MB files. Do NOT use
 * AudioContext.decodeAudioData here — that decodes the entire file into
 * memory and OOMs on large inputs.
 */
export const readAudioDuration = (file) => new Promise((resolve) => {
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  const cleanup = () => URL.revokeObjectURL(url);
  audio.addEventListener('loadedmetadata', () => {
    const { duration } = audio;
    cleanup();
    resolve(Number.isFinite(duration) ? duration : null);
  });
  audio.addEventListener('error', () => {
    cleanup();
    resolve(null);
  });
  audio.src = url;
});

/**
 * Convert a "HH:MM:SS" or numeric duration string into seconds, returning
 * null when the value can't be parsed. Mirrors how the duration widget
 * stores its values.
 */
export const parseVideoDurationSeconds = (totalDuration) => {
  if (totalDuration == null) { return null; }
  if (typeof totalDuration === 'number' && Number.isFinite(totalDuration)) {
    return totalDuration;
  }
  if (typeof totalDuration === 'string') {
    if (!totalDuration) { return null; }
    const parts = totalDuration.split(':').map(Number);
    if (parts.some(Number.isNaN)) { return null; }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1) {
      return parts[0];
    }
  }
  return null;
};

export const checkValidFileSize = ({ file, onSizeFail }) => {
  if (file.size > module.MAX_BYTES) {
    onSizeFail();
    return false;
  }
  return true;
};

export const checkValidFileType = ({ file, onTypeFail }) => {
  // Some browsers (notably Safari) leave file.type empty for less-common
  // extensions. Fall back to the extension check in that case.
  if (file.type && !module.ALLOWED_MIME_TYPES.has(file.type)) {
    onTypeFail();
    return false;
  }
  if (!file.type) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['mp3', 'm4a', 'wav', 'aac'].includes(ext)) {
      onTypeFail();
      return false;
    }
  }
  return true;
};

export const fileSizeError = () => {
  const [show, setShow] = React.useState(false);
  return {
    show,
    set: () => setShow(true),
    dismiss: () => setShow(false),
  };
};

export const fileTypeError = () => {
  const [show, setShow] = React.useState(false);
  return {
    show,
    set: () => setShow(true),
    dismiss: () => setShow(false),
  };
};

export const durationWarning = () => {
  const [warning, setWarning] = React.useState(null);
  return {
    warning,
    set: (info) => setWarning(info),
    dismiss: () => setWarning(null),
  };
};

/**
 * Owns the AbortController for the in-flight S3 PUT and exposes a stable
 * `abort()` callback the cancel button + unmount cleanup can call.
 */
export const useAbortControllerRef = () => {
  const ref = React.useRef(null);
  const create = () => {
    const controller = new AbortController();
    ref.current = controller;
    return controller;
  };
  const abort = () => {
    if (ref.current) {
      ref.current.abort();
      ref.current = null;
    }
  };
  const clear = () => {
    ref.current = null;
  };
  return { ref, create, abort, clear };
};

/**
 * Wires the hidden <input type="file"> element. Validates size + type and
 * (when valid) kicks off the duration check + upload thunk.
 */
export const fileInput = ({
  fileSizeErr,
  fileTypeErr,
  durationWarn,
  videoDurationSeconds,
  abortControllerRef,
  uploadAudioDescription,
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ref = React.useRef();
  const click = () => ref.current?.click();
  const addFile = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file works.
    if (e.target) { e.target.value = ''; }
    if (!file) { return; }

    fileSizeErr.dismiss();
    fileTypeErr.dismiss();
    durationWarn.dismiss();

    if (!module.checkValidFileType({ file, onTypeFail: fileTypeErr.set })) {
      return;
    }
    if (!module.checkValidFileSize({ file, onSizeFail: fileSizeErr.set })) {
      return;
    }

    // Read AD duration from header bytes only — safe for large files.
    const adDuration = await module.readAudioDuration(file);
    if (
      adDuration != null
      && videoDurationSeconds != null
      && Math.abs(adDuration - videoDurationSeconds) > 1
    ) {
      durationWarn.set({
        adDuration: module.formatDuration(adDuration),
        videoDuration: module.formatDuration(videoDurationSeconds),
      });
    }

    const controller = abortControllerRef.create();
    uploadAudioDescription({ file, controller });
  };
  return { click, addFile, ref };
};

export const useAudioDescriptionUpload = () => {
  const dispatch = useDispatch();
  return ({ file, controller }) => {
    dispatch(thunkActions.video.uploadAudioDescription({
      file,
      controller,
    }));
  };
};

export const useAudioDescriptionDelete = () => {
  const dispatch = useDispatch();
  return () => {
    dispatch(thunkActions.video.deleteAudioDescription());
  };
};

/**
 * Block tab close / refresh while a PUT is in flight. The browser-native
 * `beforeunload` event is the only reliable way to cover the back button +
 * tab close case.
 */
export const useBeforeUnloadGuard = (isUploading) => {
  React.useEffect(() => {
    if (!isUploading) { return undefined; }
    const handler = (e) => {
      e.preventDefault();
      // Required for Chrome/legacy browsers.
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isUploading]);
};

export default {
  MAX_BYTES,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  parseFileName,
  formatDuration,
  readAudioDuration,
  parseVideoDurationSeconds,
  checkValidFileSize,
  checkValidFileType,
  fileSizeError,
  fileTypeError,
  durationWarning,
  useAbortControllerRef,
  fileInput,
  useAudioDescriptionUpload,
  useAudioDescriptionDelete,
  useBeforeUnloadGuard,
};
