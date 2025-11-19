/* eslint-disable no-unused-vars */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/**
 * This is an example component for an xblock Editor
 * It uses pre-existing components to handle the saving of a the result of a function into the xblock's data.
 * To use run npm run-script addXblock <your>
 */

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import EditorPluginSlot from '../../../plugin-slots/EditorPluginSlot';
import {
  actions,
  selectors,
  thunkActions,
} from '../../data/redux';
import { RequestKeys } from '../../data/constants/requests';

// Thin wrapper: all logic moved to plugin slot.
const GameEditor = (props) => <EditorPluginSlot {...props} />;

GameEditor.propTypes = {
  onClose: PropTypes.func.isRequired,
  blockFinished: PropTypes.bool.isRequired,
  list: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  updateTerm: PropTypes.func.isRequired,
  updateTermImage: PropTypes.func.isRequired,
  updateDefinition: PropTypes.func.isRequired,
  updateDefinitionImage: PropTypes.func.isRequired,
  toggleOpen: PropTypes.func.isRequired,
  setList: PropTypes.func.isRequired,
  addCard: PropTypes.func.isRequired,
  removeCard: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    shuffle: PropTypes.bool.isRequired,
    timer: PropTypes.bool.isRequired,
  }).isRequired,
  shuffleTrue: PropTypes.func.isRequired,
  shuffleFalse: PropTypes.func.isRequired,
  timerTrue: PropTypes.func.isRequired,
  timerFalse: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  updateType: PropTypes.func.isRequired,
  uploadGameImage: PropTypes.func.isRequired,
  isDirty: PropTypes.bool,
};

export const mapStateToProps = (state) => ({
  blockFinished: selectors.requests.isFinished(state, { requestKey: RequestKeys.fetchBlock }),
  settings: selectors.game.settings(state),
  type: selectors.game.type(state),
  list: selectors.game.list(state),
  isDirty: selectors.game.isDirty(state),
});

export const mapDispatchToProps = {
  initializeEditor: actions.app.initializeEditor,
  shuffleTrue: actions.game.shuffleTrue,
  shuffleFalse: actions.game.shuffleFalse,
  timerTrue: actions.game.timerTrue,
  timerFalse: actions.game.timerFalse,
  updateType: actions.game.updateType,
  updateTerm: actions.game.updateTerm,
  updateTermImage: actions.game.updateTermImage,
  updateDefinition: actions.game.updateDefinition,
  updateDefinitionImage: actions.game.updateDefinitionImage,
  toggleOpen: actions.game.toggleOpen,
  setList: actions.game.setList,
  addCard: actions.game.addCard,
  removeCard: actions.game.removeCard,
  uploadGameImage: thunkActions.game.uploadGameImage,
};

export default connect(mapStateToProps, mapDispatchToProps)(GameEditor);
