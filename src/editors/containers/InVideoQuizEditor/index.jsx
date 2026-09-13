import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import InVideoQuizEditorSlot, { hooks } from '../../../plugin-slots/InVideoQuizEditorSlot';
import {
  actions,
  selectors,
  thunkActions,
} from '../../data/redux';
import { RequestKeys } from '../../data/constants/requests';

export { hooks };

// Thin container: redux wiring only. All UI, validation, and save
// logic lives in InVideoQuizEditorSlot so it can be overridden by a plugin.
export const InVideoQuizEditor = (props) => <InVideoQuizEditorSlot {...props} />;

InVideoQuizEditor.propTypes = {
  onClose: PropTypes.func.isRequired,
  returnFunction: PropTypes.func,
  blockFinished: PropTypes.bool.isRequired,
  blockId: PropTypes.string,
  blockValue: PropTypes.shape({}),
  selectedVideo: PropTypes.string,
  videos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    display_name: PropTypes.string,
    duration: PropTypes.number,
  })),
  problems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    display_name: PropTypes.string,
  })),
  quizItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    problemId: PropTypes.string,
    time: PropTypes.string,
    jumpBack: PropTypes.string,
  })),
  unitContentLoaded: PropTypes.bool.isRequired,
  setSelectedVideo: PropTypes.func.isRequired,
  addQuizItem: PropTypes.func.isRequired,
  removeQuizItem: PropTypes.func.isRequired,
  updateProblemId: PropTypes.func.isRequired,
  updateTime: PropTypes.func.isRequired,
  updateJumpBack: PropTypes.func.isRequired,
  loadInVideoQuizSettings: PropTypes.func.isRequired,
  saveInVideoQuizSettings: PropTypes.func.isRequired,
  isDirty: PropTypes.bool.isRequired,
};

InVideoQuizEditor.defaultProps = {
  blockId: null,
  blockValue: null,
  selectedVideo: null,
  videos: [],
  problems: [],
  quizItems: [],
};

export const mapStateToProps = (state) => ({
  blockFinished: selectors.requests.isFinished(state, { requestKey: RequestKeys.fetchBlock }),
  blockId: selectors.app.blockId(state),
  blockValue: selectors.app.blockValue(state),
  selectedVideo: selectors.inVideoQuiz.selectedVideo(state),
  videos: selectors.inVideoQuiz.videos(state),
  problems: selectors.inVideoQuiz.problems(state),
  quizItems: selectors.inVideoQuiz.quizItems(state),
  isDirty: selectors.inVideoQuiz.isDirty(state),
  unitContentLoaded: selectors.inVideoQuiz.unitContentLoaded(state),
});

export const mapDispatchToProps = {
  setSelectedVideo: actions.inVideoQuiz.setSelectedVideo,
  addQuizItem: actions.inVideoQuiz.addQuizItem,
  removeQuizItem: actions.inVideoQuiz.removeQuizItem,
  updateProblemId: actions.inVideoQuiz.updateProblemId,
  updateTime: actions.inVideoQuiz.updateTime,
  updateJumpBack: actions.inVideoQuiz.updateJumpBack,
  loadInVideoQuizSettings: thunkActions.inVideoQuiz.loadInVideoQuizSettings,
  saveInVideoQuizSettings: thunkActions.inVideoQuiz.saveInVideoQuizSettings,
};

export default connect(mapStateToProps, mapDispatchToProps)(InVideoQuizEditor);
