import {
  MAX_TRANSCRIPT_BYTES,
  formatBlockTimestamp,
  isValidSrt,
  msToSrtTime,
  parseSrt,
  serializeSrt,
  srtTimeToMs,
  validateCueText,
  validateCues,
  validateSrtFile,
} from './srtUtils';

describe('srtUtils', () => {
  const originalFileReader = global.FileReader;

  afterEach(() => {
    global.FileReader = originalFileReader;
    jest.clearAllMocks();
  });

  it('parses and serializes SRT cue blocks', () => {
    const srt = '1\n00:00:00,000 --> 00:00:01,500\nHello\n\n2\n00:00:02,000 --> 00:00:03,000\nWorld';

    const cues = parseSrt(srt);

    expect(cues).toEqual([
      expect.objectContaining({
        index: 1,
        startMs: 0,
        endMs: 1500,
        text: 'Hello',
      }),
      expect.objectContaining({
        index: 2,
        startMs: 2000,
        endMs: 3000,
        text: 'World',
      }),
    ]);
    expect(serializeSrt(cues)).toBe(
      '1\n00:00:00,000 --> 00:00:01,500\nHello\n\n2\n00:00:02,000 --> 00:00:03,000\nWorld\n',
    );
  });

  it('converts between milliseconds and SRT timestamps', () => {
    expect(msToSrtTime(3723004)).toBe('01:02:03,004');
    expect(srtTimeToMs('1:02:03,004')).toBe(3723004);
    expect(formatBlockTimestamp(3723004)).toBe('1:02:03');
    expect(srtTimeToMs('00:61:00,000')).toBeNull();
  });

  it('validates cue text and cue timing issues', () => {
    expect(validateCueText('')).toBe('empty');
    expect(validateCueText('Line one\n\nLine two')).toBe('blankLine');
    expect(validateCueText('7')).toBe('looksLikeIndex');
    expect(validateCueText('00:00:00,000 --> 00:00:01,000')).toBe('looksLikeTimestamp');
    expect(validateCueText('Hello world')).toBeNull();

    expect(validateCues([
      { startMs: 1000, endMs: 500, text: 'Hello' },
      { startMs: 2000, endMs: 2500, text: '' },
    ])).toEqual([
      { i: 0, code: 'endBeforeStart' },
      { i: 1, code: 'empty' },
    ]);
  });

  it('checks whole-file SRT validity', () => {
    expect(isValidSrt('1\n00:00:00,000 --> 00:00:01,000\nHello')).toBe(true);
    expect(isValidSrt('not an srt file')).toBe(false);
  });

  it('rejects empty and oversize files before reading them', () => {
    const onEmptyFail = jest.fn();
    const onSizeFail = jest.fn();

    validateSrtFile(new File([], 'empty.srt'), {
      onEmptyFail,
      onSizeFail,
      onInvalidFail: jest.fn(),
      onValid: jest.fn(),
    });

    expect(onEmptyFail).toHaveBeenCalled();

    const oversizedFile = new File(['content'], 'big.srt');
    Object.defineProperty(oversizedFile, 'size', { value: MAX_TRANSCRIPT_BYTES + 1 });

    validateSrtFile(oversizedFile, {
      onEmptyFail: jest.fn(),
      onSizeFail,
      onInvalidFail: jest.fn(),
      onValid: jest.fn(),
    });

    expect(onSizeFail).toHaveBeenCalled();
  });

  it('accepts valid SRT files and rejects invalid ones after reading', () => {
    const validFile = new File(['valid'], 'valid.srt');
    const invalidFile = new File(['invalid'], 'invalid.srt');
    const onValid = jest.fn();
    const onInvalidFail = jest.fn();

    global.FileReader = class {
      readAsText(file) {
        this.onload({
          target: {
            result: file.name === 'valid.srt'
              ? '1\n00:00:00,000 --> 00:00:01,000\nHello'
              : 'not an srt file',
          },
        });
      }
    };

    validateSrtFile(validFile, {
      onEmptyFail: jest.fn(),
      onSizeFail: jest.fn(),
      onInvalidFail,
      onValid,
    });
    validateSrtFile(invalidFile, {
      onEmptyFail: jest.fn(),
      onSizeFail: jest.fn(),
      onInvalidFail,
      onValid,
    });

    expect(onValid).toHaveBeenCalledWith(validFile);
    expect(onInvalidFail).toHaveBeenCalledTimes(1);
  });
});
