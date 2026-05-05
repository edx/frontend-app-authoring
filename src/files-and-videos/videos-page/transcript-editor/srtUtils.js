const TIMESTAMP_RE = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
const pad2 = (n) => String(n).padStart(2, '0');
const pad3 = (n) => String(n).padStart(3, '0');

export const MAX_TRANSCRIPT_BYTES = 25 * 1024 * 1024;

export function parseSrt(srt) {
  if (!srt || typeof srt !== 'string') {
    return [];
  }
  const blocks = srt.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  const cues = [];
  blocks.forEach((block, i) => {
    const lines = block.split('\n').filter((l) => l !== undefined);
    if (lines.length < 2) {
      return;
    }
    let cursor = 0;
    let index = i + 1;
    if (!TIMESTAMP_RE.test(lines[0])) {
      const parsed = parseInt(lines[0].trim(), 10);
      if (!Number.isNaN(parsed)) {
        index = parsed;
      }
      cursor = 1;
    }
    const tsLine = lines[cursor];
    const m = tsLine && tsLine.match(TIMESTAMP_RE);
    if (!m) {
      return;
    }
    const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = m;
    const startMs = (((+h1 * 60) + +m1) * 60 + +s1) * 1000 + +ms1;
    const endMs = (((+h2 * 60) + +m2) * 60 + +s2) * 1000 + +ms2;
    const text = lines.slice(cursor + 1).join('\n');
    cues.push({
      index,
      startMs,
      endMs,
      startText: `${h1}:${m1}:${s1},${ms1}`,
      endText: `${h2}:${m2}:${s2},${ms2}`,
      text,
    });
  });
  return cues;
}

export function msToSrtTime(ms) {
  const totalSec = Math.floor((ms || 0) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const millis = Math.max(0, (ms || 0) - totalSec * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(millis)}`;
}

export function serializeSrt(cues) {
  return cues
    .map((cue, i) => {
      const start = cue.startText || msToSrtTime(cue.startMs);
      const end = cue.endText || msToSrtTime(cue.endMs);
      return `${i + 1}\n${start} --> ${end}\n${cue.text}`;
    })
    .join('\n\n')
    .concat('\n');
}

export function formatBlockTimestamp(ms) {
  const totalSec = Math.floor((ms || 0) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${pad2(m)}:${pad2(s)}`;
  }
  return `${pad2(m)}:${pad2(s)}`;
}

export function srtTimeToMs(str) {
  if (typeof str !== 'string') { return null; }
  const trimmed = str.trim().replace('.', ',');
  const m = trimmed.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:,(\d{1,3}))?$/);
  if (!m) { return null; }
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  const ms = parseInt((m[4] || '0').padEnd(3, '0').slice(0, 3), 10);
  if (min > 59 || sec > 59) { return null; }
  return ((h * 3600) + (min * 60) + sec) * 1000 + ms;
}

export function validateCueText(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return 'empty';
  }
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().length === 0 && i !== lines.length - 1) {
      return 'blankLine';
    }
  }
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (/^\d+$/.test(trimmed)) {
      return 'looksLikeIndex';
    }
    if (/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(trimmed)) {
      return 'looksLikeTimestamp';
    }
  }
  return null;
}

export function isValidSrt(srt) {
  if (!srt || typeof srt !== 'string') { return false; }
  const blocks = srt.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  let hasAnyCue = false;
  for (let i = 0; i < blocks.length; i += 1) {
    const lines = blocks[i].split('\n').filter((l) => l.trim() !== '');
    if (lines.length >= 2) {
      let cursor = 0;
      if (!TIMESTAMP_RE.test(lines[0])) {
        const parsed = parseInt(lines[0].trim(), 10);
        if (!Number.isNaN(parsed)) {
          cursor = 1;
        } else {
          return false;
        }
      }
      const tsLine = lines[cursor];
      if (!tsLine || !TIMESTAMP_RE.test(tsLine)) {
        return false;
      }
      hasAnyCue = true;
    }
  }
  return hasAnyCue;
}

export function validateSrtFile(file, {
  onEmptyFail, onSizeFail, onInvalidFail, onValid,
}) {
  if (!file || file.size === 0) { onEmptyFail(); return; }
  if (file.size > MAX_TRANSCRIPT_BYTES) { onSizeFail(); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    if (!isValidSrt(e.target.result)) { onInvalidFail(); return; }
    onValid(file);
  };
  reader.readAsText(file);
}

export function validateCues(cues) {
  const issues = [];
  cues.forEach((cue, i) => {
    const textCode = validateCueText(cue.text);
    if (textCode) {
      issues.push({ i, code: textCode });
    }
    if (typeof cue.endMs === 'number'
        && typeof cue.startMs === 'number'
        && cue.endMs <= cue.startMs) {
      issues.push({ i, code: 'endBeforeStart' });
    }
  });
  return issues;
}
