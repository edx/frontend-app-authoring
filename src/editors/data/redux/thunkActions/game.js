import { StrictDict } from '../../../utils';
import * as requests from './requests';
import { actions as gameActions } from '../game';
import { actions as requestsActions } from '../requests';
import { RequestKeys } from '../../constants/requests';

const actions = {
  game: gameActions,
  requests: requestsActions,
};

/**
 * Upload an image for games xblock and update the state with the returned URL
 * @param {number} index - The index of the card in the list
 * @param {File} imageFile - The image file to upload
 * @param {string} imageType - Either 'term' or 'definition'
 */
export const uploadGameImage = ({ index, imageFile, imageType }) => (dispatch) => {
  dispatch(requests.uploadGamesImage({
    image: imageFile,
    onSuccess: (response) => {
      // Extract the URL from the response
      // Response format: { success: true, url: "/media/games/...", filename: "..." }
      const imageUrl = response.data?.url;
      
      if (imageType === 'term') {
        dispatch(actions.game.updateTermImage({ index, termImage: imageUrl }));
      } else if (imageType === 'definition') {
        dispatch(actions.game.updateDefinitionImage({ index, definitionImage: imageUrl }));
      }
    },
    onFailure: (error) => {
      console.error('Failed to upload game image:', error);
      dispatch(actions.requests.failRequest({
        requestKey: RequestKeys.uploadAsset,
        error,
      }));
    },
  }));
};

export default StrictDict({
  uploadGameImage,
});
