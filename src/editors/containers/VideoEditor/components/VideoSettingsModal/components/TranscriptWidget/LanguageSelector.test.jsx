import React from 'react';
import {
  render, screen, initializeMocks, fireEvent,
} from '@src/testUtils';
import LanguageSelector, { hooks } from './LanguageSelector';
import { selectors, thunkActions } from '../../../../../../data/redux';
import { validateSrtFile } from '../../../../../../../files-and-videos/videos-page/transcript-editor/srtUtils';

jest.mock('../../../../../../../files-and-videos/videos-page/transcript-editor/srtUtils', () => ({
  validateSrtFile: jest.fn(),
}));

const lang1 = 'kLinGon';
const lang1Code = 'kl';
const lang2 = 'eLvIsh';
const lang2Code = 'el';
const lang3 = 'sImLisH';
const lang3Code = 'sl';

jest.mock('../../../../../../data/constants/video', () => ({
  videoTranscriptLanguages: {
    [lang1Code]: lang1,
    [lang2Code]: lang2,
    [lang3Code]: lang3,
  },
}));

describe('LanguageSelector', () => {
  const mockValidateSrtFile = validateSrtFile;
  const props = {
    onSelect: jest.fn().mockName('props.OnSelect'),
    index: 1,
    language: lang1Code,
    openLanguages: [[lang2Code, lang2], [lang3Code, lang3]],
  };
  beforeEach(() => {
    initializeMocks();
    mockValidateSrtFile.mockReset();
    jest.spyOn(thunkActions.video, 'uploadTranscript').mockImplementation((payload) => ({ payload }));
  });

  test('renders component with selected language', () => {
    const { video } = selectors;
    jest.spyOn(video, 'openLanguages').mockReturnValue(props.openLanguages);
    const { container } = render(<LanguageSelector {...props} />);
    expect(screen.getByRole('button', { name: 'Languages' })).toBeInTheDocument();
    expect(screen.getByText(lang1)).toBeInTheDocument();
    expect(container.querySelector('input.upload[type="file"]')).toBeInTheDocument();
  });

  test('renders component with no selection', () => {
    const { video } = selectors;
    jest.spyOn(video, 'openLanguages').mockReturnValue(props.openLanguages);
    render(<LanguageSelector {...props} language="" />);
    expect(screen.getByText('Select Language')).toBeInTheDocument();
  });

  test('transcripts no Open Languages, all dropdown items should be disabled', () => {
    const { video } = selectors;
    jest.spyOn(video, 'openLanguages').mockReturnValue([]);
    const { container } = render(<LanguageSelector {...props} language="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Languages' }));
    const disabledItems = container.querySelectorAll('.disabled.dropdown-item');
    expect(disabledItems.length).toBe(3);
  });

  test('filters languages from the search box', () => {
    const { video } = selectors;
    jest.spyOn(video, 'openLanguages').mockReturnValue(props.openLanguages);
    render(<LanguageSelector {...props} language="" />);

    fireEvent.click(screen.getByRole('button', { name: 'Languages' }));
    fireEvent.change(screen.getByPlaceholderText('Search languages'), { target: { value: 'elv' } });

    expect(screen.getByText(lang2)).toBeInTheDocument();
    expect(screen.queryByText(lang3)).not.toBeInTheDocument();
  });

  test('shows no results message when the search does not match any language', () => {
    const { video } = selectors;
    jest.spyOn(video, 'openLanguages').mockReturnValue(props.openLanguages);
    render(<LanguageSelector {...props} language="" />);

    fireEvent.click(screen.getByRole('button', { name: 'Languages' }));
    fireEvent.change(screen.getByPlaceholderText('Search languages'), { target: { value: 'zzzz' } });

    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  test('hooks.addFileCallback validates before dispatching uploadTranscript', () => {
    const dispatch = jest.fn();
    const file = { name: 'captions.srt', size: 12 };
    mockValidateSrtFile.mockImplementation((_file, callbacks) => callbacks.onValid(file));

    const callback = hooks.addFileCallback({
      dispatch,
      localLang: lang2Code,
      onSizeFail: jest.fn(),
      onInvalidFail: jest.fn(),
    });

    callback(file);

    expect(mockValidateSrtFile).toHaveBeenCalledWith(file, expect.objectContaining({
      onSizeFail: expect.any(Function),
      onInvalidFail: expect.any(Function),
      onValid: expect.any(Function),
    }));
    expect(thunkActions.video.uploadTranscript).toHaveBeenCalledWith({
      file,
      filename: file.name,
      language: lang2Code,
    });
    expect(dispatch).toHaveBeenCalled();
  });

  test('hooks.addFileCallback surfaces invalid-file failures without dispatching', () => {
    const dispatch = jest.fn();
    const onInvalidFail = jest.fn();
    const file = { name: 'invalid.srt', size: 12 };
    mockValidateSrtFile.mockImplementation((_file, callbacks) => callbacks.onInvalidFail());

    const callback = hooks.addFileCallback({
      dispatch,
      localLang: lang2Code,
      onSizeFail: jest.fn(),
      onInvalidFail,
    });

    callback(file);

    expect(onInvalidFail).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
