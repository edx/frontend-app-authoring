import { StrictDict } from '../../../utils';
import * as requests from './requests';
import { actions as inVideoQuizActions } from '../inVideoQuiz';
import { actions as requestsActions } from '../requests';
import { selectors as appSelectors } from '../app';
import { selectors as inVideoQuizSelectors } from '../inVideoQuiz';
import { RequestKeys } from '../../constants/requests';
import { getUnitHandler } from '../../../../course-outline/unit-card/data/api';
import api from '../../services/cms/api';

const actions = {
  inVideoQuiz: inVideoQuizActions,
  requests: requestsActions,
};

const selectors = {
  app: appSelectors,
  inVideoQuiz: inVideoQuizSelectors,
};

const extractBlockId = (fullBlockId) => {
  const parts = fullBlockId.split('@');
  return parts[parts.length - 1];
};

/**
 * Parse studio_view HTML response to extract field values
 * @param {string} html - The HTML response from studio_view API
 * @returns {object} - Object containing video_id and timemap
 */
const parseStudioViewHtml = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract video_id from input field
  const videoIdInput = doc.querySelector('#xb-field-edit-video_id');
  const videoId = videoIdInput ? videoIdInput.value : '';
  
  // Extract timemap from textarea
  const timemapTextarea = doc.querySelector('#xb-field-edit-timemap');
  let timemap = {};
  
  if (timemapTextarea && timemapTextarea.value) {
    try {
      // The value might be HTML-encoded JSON, so we need to decode it
      const decodedValue = timemapTextarea.value
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      timemap = JSON.parse(decodedValue);
    } catch (error) {
      console.error('Failed to parse timemap:', error);
    }
  }
  
  return { videoId, timemap };
};

export const loadInVideoQuizSettings = () => (dispatch, getState) => {
  dispatch(actions.requests.startRequest(RequestKeys.fetchBlock));
  
  // First, fetch the studio_view to get the current form values
  dispatch(requests.fetchStudioView({
    onSuccess: (studioViewResponse) => {
      const { videoId, timemap } = parseStudioViewHtml(studioViewResponse.data.html);
      
      // Then fetch the unit data to populate videos and problems dropdowns
      dispatch(requests.fetchUnit({
        onSuccess: (response) => {
          const ancestors = response.data?.ancestors || [];
          const unitAncestor = ancestors.find((ancestor) => ancestor.category === 'vertical');
          
          if (!unitAncestor) {
            dispatch(actions.inVideoQuiz.setDirty(false));
            dispatch(actions.requests.completeRequest({ 
              requestKey: RequestKeys.fetchBlock, 
              response: { data: {} } 
            }));
            return;
          }
          
          const unitId = unitAncestor.id;
          
          getUnitHandler(unitId)
            .then((data) => {
              const videos = data.components
                .filter((component) => component.blockType === 'video')
                .map((video) => ({
                  id: extractBlockId(video.blockId),
                  display_name: video.displayName,
                }))
                .sort((a, b) => a.display_name.localeCompare(b.display_name));
              
              const problems = data.components
                .filter((component) => component.blockType === 'problem')
                .map((problem) => ({
                  id: extractBlockId(problem.blockId),
                  display_name: problem.displayName,
                }));
              
              dispatch(actions.inVideoQuiz.setVideos(videos));
              dispatch(actions.inVideoQuiz.setProblems(problems));
              
              // Set the selected video from the studio_view data
              if (videoId) {
                dispatch(actions.inVideoQuiz.setSelectedVideo(videoId));
              }
              
              // Parse timemap and populate quiz items
              // timemap format: {"5": "problemId1", "120": "problemId2"}
              // Convert to quizItems format
              const quizItems = Object.entries(timemap).map(([time, problemId]) => ({
                id: `problem-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                problemId,
                time,
                jumpBack: '', // Default value, not stored in timemap
              }));
              
              if (quizItems.length > 0) {
                dispatch(actions.inVideoQuiz.setQuizItems(quizItems));
              }
              
              dispatch(actions.inVideoQuiz.setDirty(false));
              dispatch(actions.requests.completeRequest({ 
                requestKey: RequestKeys.fetchBlock, 
                response: { data } 
              }));
            })
            .catch((error) => {
              dispatch(actions.requests.failRequest({
                requestKey: RequestKeys.fetchBlock,
                error,
              }));
            });
        },
        onFailure: (error) => {
          dispatch(actions.requests.failRequest({
            requestKey: RequestKeys.fetchBlock,
            error,
          }));
        },
      }));
    },
    onFailure: (error) => {
      dispatch(actions.requests.failRequest({
        requestKey: RequestKeys.fetchBlock,
        error,
      }));
    },
  }));
};

/**
 * Save in-video quiz settings to the backend
 * @param {[func]} onSuccess - onSuccess callback ((response) => { ... })
 * @param {[func]} onFailure - onFailure callback ((error) => { ... })
 */
export const saveInVideoQuizSettings = ({ onSuccess, onFailure } = {}) => (dispatch, getState) => {
  const state = getState();
  const selectedVideo = selectors.inVideoQuiz.selectedVideo(state);
  const quizItems = selectors.inVideoQuiz.quizItems(state);
  const blockId = selectors.app.blockId(state);
  const studioEndpointUrl = selectors.app.studioEndpointUrl(state);
  
  // Convert quizItems array to timemap object
  // Format: {"5": "problemId1", "120": "problemId2"}
  const timemapObject = quizItems.reduce((acc, item) => {
    if (item.problemId && item.time) {
      acc[item.time] = item.problemId;
    }
    return acc;
  }, {});
  
  // Convert timemap object to JSON string
  const timemapString = JSON.stringify(timemapObject);
  
  dispatch(actions.requests.startRequest(RequestKeys.saveBlock));
  
  api.saveInVideoQuizSettings({
    studioEndpointUrl,
    blockId,
    videoId: selectedVideo || '',
    timemap: timemapString,
  })
    .then((response) => {
      dispatch(actions.inVideoQuiz.setDirty(false));
      dispatch(actions.requests.completeRequest({
        requestKey: RequestKeys.saveBlock,
        response,
      }));
      if (onSuccess) {
        onSuccess(response);
      }
    })
    .catch((error) => {
      dispatch(actions.requests.failRequest({
        requestKey: RequestKeys.saveBlock,
        error,
      }));
      if (onFailure) {
        onFailure(error);
      }
    });
};

export default StrictDict({
  loadInVideoQuizSettings,
  saveInVideoQuizSettings,
});
