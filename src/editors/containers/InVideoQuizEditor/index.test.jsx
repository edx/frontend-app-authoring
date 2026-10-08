import React from 'react';
import {
  screen, fireEvent, initializeMocks, within,
} from '@src/testUtils';
import { editorRender } from '@src/editors/editorTestRender';
import { thunkActions } from '@src/editors/data/redux';
import ConnectedInVideoQuizEditor, { hooks } from './index';

// Mock thunks that make API calls. Must use jest.mock (hoisted) rather than
// jest.spyOn because mapDispatchToProps captures function references at module
// load time, before jest.spyOn would run.
jest.mock('../../data/redux/thunkActions/inVideoQuiz', () => {
  const load = jest.fn(() => () => Promise.resolve());
  const save = jest.fn(() => () => Promise.resolve());
  return {
    __esModule: true,
    default: { loadInVideoQuizSettings: load, saveInVideoQuizSettings: save },
    loadInVideoQuizSettings: load,
    saveInVideoQuizSettings: save,
  };
});

jest.mock('../EditorContainer', () => ({
  __esModule: true,
  default: ({ children, onSave }) => (
    <div data-testid="editor-container">
      <button
        type="button"
        data-testid="save-button"
        onClick={() => onSave && onSave()}
      >
        Save
      </button>
      {children}
    </div>
  ),
}));

jest.mock('../../sharedComponents/Button', () => ({
  __esModule: true,
  default: ({
    children, onClick, className,
  }) => (
    <button
      type="button"
      data-testid="custom-button"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../hooks', () => ({
  navigateCallback: jest.fn(() => jest.fn()),
}));

jest.mock('../../data/constants/analyticsEvt', () => ({
  editorSaveClick: 'editor_save_click',
}));

const baseState = {
  app: {
    blockId: 'test-block-id',
    blockValue: {
      data: {
        id: 'test-block-id', display_name: 'Test', data: '', metadata: {},
      },
    },
  },
  requests: {
    fetchBlock: { status: 'completed' },
  },
  inVideoQuiz: {
    selectedVideo: null,
    videos: [],
    problems: [],
    unitContentLoaded: false,
    quizItems: [
      {
        id: 'quiz-1', problemId: '', time: '', jumpBack: '',
      },
    ],
    isDirty: false,
  },
};

describe('InVideoQuizEditor', () => {
  beforeEach(() => {
    initializeMocks();
  });

  describe('Content not found alerts', () => {
    it('shows both alerts when no videos and no problems exist in the unit', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
            },
          },
        },
      );

      expect(screen.getByText('Content not found')).toBeInTheDocument();
      expect(screen.getByText('No video found for this unit')).toBeInTheDocument();
      expect(screen.getByText('No problem found for this unit')).toBeInTheDocument();
    });

    it('shows only video alert when no videos exist but problems do', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              problems: [{ id: 'problem-1', display_name: 'Problem 1' }],
            },
          },
        },
      );

      expect(screen.getByText('Content not found')).toBeInTheDocument();
      expect(screen.getByText('No video found for this unit')).toBeInTheDocument();
      expect(screen.queryByText('No problem found for this unit')).not.toBeInTheDocument();
    });

    it('shows only problem alert when no problems exist but videos do', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              videos: [{ id: 'video-1', display_name: 'Video 1' }],
            },
          },
        },
      );

      expect(screen.getByText('Content not found')).toBeInTheDocument();
      expect(screen.queryByText('No video found for this unit')).not.toBeInTheDocument();
      expect(screen.getByText('No problem found for this unit')).toBeInTheDocument();
    });

    it('does not show alert when both videos and problems exist', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              videos: [{ id: 'video-1', display_name: 'Video 1' }],
              problems: [{ id: 'problem-1', display_name: 'Problem 1' }],
            },
          },
        },
      );

      expect(screen.queryByText('Content not found')).not.toBeInTheDocument();
      expect(screen.queryByText('No video found for this unit')).not.toBeInTheDocument();
      expect(screen.queryByText('No problem found for this unit')).not.toBeInTheDocument();
    });

    it('does not show alert while still loading', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        { initialState: baseState },
      );

      expect(screen.queryByText('Content not found')).not.toBeInTheDocument();
      expect(screen.queryByText('No video found for this unit')).not.toBeInTheDocument();
      expect(screen.queryByText('No problem found for this unit')).not.toBeInTheDocument();
    });

    it('dismisses the alert when close button is clicked', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
            },
          },
        },
      );

      expect(screen.getByText('Content not found')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Content not found')).not.toBeInTheDocument();
      expect(screen.queryByText('No video found for this unit')).not.toBeInTheDocument();
      expect(screen.queryByText('No problem found for this unit')).not.toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('renders loading spinner when block not finished', () => {
      const { container } = editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            requests: {
              fetchBlock: { status: 'pending' },
            },
          },
        },
      );

      expect(screen.getByTestId('editor-container')).toBeInTheDocument();
      expect(container.querySelector('.pgn__spinner')).toBeInTheDocument();
    });

    it('renders loading spinner while unit content is loading', () => {
      const { container } = editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        { initialState: baseState },
      );

      expect(screen.getByTestId('editor-container')).toBeInTheDocument();
      expect(container.querySelector('.pgn__spinner')).toBeInTheDocument();
      expect(screen.queryByText('Content not found')).not.toBeInTheDocument();
    });

    it('renders editor form when block is finished', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              videos: [{ id: 'video-1', display_name: 'Video 1' }],
              problems: [{ id: 'problem-1', display_name: 'Problem 1' }],
            },
          },
        },
      );

      expect(screen.getByText('Video')).toBeInTheDocument();
      expect(screen.getByText('Problem')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('renders video options in the dropdown', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              videos: [
                { id: 'video-1', display_name: 'Intro Video' },
                { id: 'video-2', display_name: 'Lecture Video' },
              ],
              problems: [{ id: 'problem-1', display_name: 'Problem 1' }],
            },
          },
        },
      );

      expect(screen.getByText('Intro Video')).toBeInTheDocument();
      expect(screen.getByText('Lecture Video')).toBeInTheDocument();
    });

    it('renders problem options in the dropdown', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              videos: [{ id: 'video-1', display_name: 'Video 1' }],
              problems: [
                { id: 'problem-1', display_name: 'Quiz Question 1' },
                { id: 'problem-2', display_name: 'Quiz Question 2' },
              ],
            },
          },
        },
      );

      expect(screen.getByText('Quiz Question 1')).toBeInTheDocument();
      expect(screen.getByText('Quiz Question 2')).toBeInTheDocument();
    });

    it('adds a quiz item when Add problem button is clicked', () => {
      const { container } = editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
            },
          },
        },
      );

      const initialRows = container.querySelectorAll('.quiz-item-row').length;
      fireEvent.click(screen.getByText('Add problem'));
      const updatedRows = container.querySelectorAll('.quiz-item-row').length;
      expect(updatedRows).toBe(initialRows + 1);
    });

    it('removes a quiz item when delete button is clicked', () => {
      const { container } = editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
            },
          },
        },
      );

      expect(container.querySelectorAll('.quiz-item-row').length).toBe(1);
      const deleteButtons = screen.getAllByRole('button', { name: 'Delete problem' });
      fireEvent.click(deleteButtons[0]);
      expect(container.querySelectorAll('.quiz-item-row').length).toBe(0);
    });

    it('calls loadInVideoQuizSettings on mount when block is finished', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        { initialState: baseState },
      );

      expect(thunkActions.inVideoQuiz.loadInVideoQuizSettings).toHaveBeenCalled();
    });

    it('allows saving when multiple problems share the same timestamp', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              selectedVideo: 'video-1',
              videos: [{ id: 'video-1', display_name: 'Video 1' }],
              problems: [
                { id: 'problem-1', display_name: 'Problem 1' },
                { id: 'problem-2', display_name: 'Problem 2' },
              ],
              quizItems: [
                {
                  id: 'quiz-1', problemId: 'problem-1', time: '1:30', jumpBack: '',
                },
                {
                  id: 'quiz-2', problemId: 'problem-2', time: '1:30', jumpBack: '',
                },
              ],
            },
          },
        },
      );

      fireEvent.click(screen.getByTestId('save-button'));

      expect(screen.queryByText('Each problem must have a unique timestamp. Please remove duplicate times.')).not.toBeInTheDocument();
      expect(thunkActions.inVideoQuiz.saveInVideoQuizSettings).toHaveBeenCalled();
    });
  });

  describe('Video validation', () => {
    const configuredState = {
      ...baseState,
      inVideoQuiz: {
        ...baseState.inVideoQuiz,
        unitContentLoaded: true,
        videos: [{ id: 'video-1', display_name: 'Video 1' }],
        problems: [{ id: 'problem-1', display_name: 'Problem 1' }],
        quizItems: [
          {
            id: 'quiz-1', problemId: 'problem-1', time: '1:30', jumpBack: '',
          },
        ],
      },
    };

    it('shows inline error and blocks save when a row is configured but no video is selected', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        { initialState: configuredState },
      );

      expect(screen.getByText('Please select a video.')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('save-button'));

      expect(screen.getByText('Error saving in-video quiz')).toBeInTheDocument();
      expect(screen.getAllByText('Please select a video.')).toHaveLength(2);
      expect(thunkActions.inVideoQuiz.saveInVideoQuizSettings).not.toHaveBeenCalled();
    });

    it('does not show the video error when no row is fully configured', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...configuredState,
            inVideoQuiz: {
              ...configuredState.inVideoQuiz,
              quizItems: [{
                id: 'quiz-1', problemId: '', time: '', jumpBack: '',
              }],
            },
          },
        },
      );

      expect(screen.queryByText('Please select a video.')).not.toBeInTheDocument();
    });

    it('clears the video error once a video is selected', () => {
      const { container } = editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        { initialState: configuredState },
      );

      expect(screen.getByText('Please select a video.')).toBeInTheDocument();

      fireEvent.change(
        container.querySelector('.video-select-container select'),
        { target: { value: 'video-1' } },
      );

      expect(screen.queryByText('Please select a video.')).not.toBeInTheDocument();
    });

    it('flags a saved video id that no longer exists in the unit', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...configuredState,
            inVideoQuiz: { ...configuredState.inVideoQuiz, selectedVideo: 'deleted-video' },
          },
        },
      );

      fireEvent.click(screen.getByTestId('save-button'));

      expect(screen.getAllByText('Please select a video.')).toHaveLength(2);
      expect(thunkActions.inVideoQuiz.saveInVideoQuizSettings).not.toHaveBeenCalled();
    });

    it('blocks save when nothing is configured', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...configuredState,
            inVideoQuiz: {
              ...configuredState.inVideoQuiz,
              selectedVideo: null,
              quizItems: [{
                id: 'quiz-1', problemId: '', time: '', jumpBack: '',
              }],
            },
          },
        },
      );

      fireEvent.click(screen.getByTestId('save-button'));

      expect(screen.getByText('Please select a video and add at least one problem.')).toBeInTheDocument();
      expect(thunkActions.inVideoQuiz.saveInVideoQuizSettings).not.toHaveBeenCalled();
    });

    it('blocks save when a video is selected but no problem has been added', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...configuredState,
            inVideoQuiz: {
              ...configuredState.inVideoQuiz,
              selectedVideo: 'video-1',
              quizItems: [{
                id: 'quiz-1', problemId: '', time: '', jumpBack: '',
              }],
            },
          },
        },
      );

      fireEvent.click(screen.getByTestId('save-button'));

      expect(screen.getByText('Please add at least one problem.')).toBeInTheDocument();
      expect(thunkActions.inVideoQuiz.saveInVideoQuizSettings).not.toHaveBeenCalled();
    });

    it('does not block as entirely-empty once a problem or time has been entered', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...configuredState,
            inVideoQuiz: {
              ...configuredState.inVideoQuiz,
              selectedVideo: null,
              quizItems: [{
                id: 'quiz-1', problemId: 'problem-1', time: '', jumpBack: '',
              }],
            },
          },
        },
      );

      fireEvent.click(screen.getByTestId('save-button'));

      expect(screen.queryByText('Please select a video and add at least one problem.')).not.toBeInTheDocument();
      expect(screen.getAllByText('Please enter a time for the selected problem.')).toHaveLength(2);
    });

    it('reports the video error before per-row errors when both are present', () => {
      editorRender(
        <ConnectedInVideoQuizEditor onClose={jest.fn()} />,
        {
          initialState: {
            ...baseState,
            inVideoQuiz: {
              ...baseState.inVideoQuiz,
              unitContentLoaded: true,
              videos: [{ id: 'video-1', display_name: 'Video 1' }],
              problems: [
                { id: 'problem-1', display_name: 'Problem 1' },
                { id: 'problem-2', display_name: 'Problem 2' },
              ],
              quizItems: [
                {
                  id: 'quiz-1', problemId: 'problem-1', time: '1:30', jumpBack: '',
                },
                {
                  id: 'quiz-2', problemId: 'problem-2', time: '', jumpBack: '',
                },
              ],
            },
          },
        },
      );

      fireEvent.click(screen.getByTestId('save-button'));

      // The per-row inline feedback for quiz-2's missing time is independently
      // always-live (see 'does not show the video error when no row is fully
      // configured' etc.), so it may still render alongside the banner. What
      // this test actually verifies is that the *banner* - which handleSave
      // only ever shows one message in - reports the video error, not the
      // per-row one, proving the reorder in handleSave.
      const banner = screen.getByRole('alert');
      expect(within(banner).getByText('Please select a video.')).toBeInTheDocument();
      expect(within(banner).queryByText('Please enter a time for the selected problem.')).not.toBeInTheDocument();
      expect(thunkActions.inVideoQuiz.saveInVideoQuizSettings).not.toHaveBeenCalled();
    });
  });

  describe('hooks.getContent', () => {
    it('filters out quiz items without problemId', () => {
      const result = hooks.getContent({
        selectedVideo: 'video-1',
        quizItems: [
          { id: '1', problemId: 'p1', time: '1:00' },
          { id: '2', problemId: '', time: '' },
          { id: '3', problemId: 'p3', time: '3:00' },
        ],
      });

      expect(result.selectedVideo).toBe('video-1');
      expect(result.quizItems).toHaveLength(2);
      expect(result.quizItems[0].problemId).toBe('p1');
      expect(result.quizItems[1].problemId).toBe('p3');
    });

    it('returns empty quizItems when none have problemId', () => {
      const result = hooks.getContent({
        selectedVideo: null,
        quizItems: [
          { id: '1', problemId: '', time: '' },
        ],
      });

      expect(result.quizItems).toHaveLength(0);
    });
  });
});
