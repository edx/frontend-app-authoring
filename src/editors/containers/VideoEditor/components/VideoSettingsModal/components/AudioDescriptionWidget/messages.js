import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  titleLabel: {
    id: 'authoring.videoeditor.audioDescription.title.label',
    defaultMessage: 'Audio Description (AD)',
    description: 'Title for the audio description widget',
  },
  uploadButtonLabel: {
    id: 'authoring.videoeditor.audioDescription.upload.label',
    defaultMessage: 'Upload Audio Description (AD) File',
    description: 'Label for upload button',
  },
  addAudioDescriptionMessage: {
    id: 'authoring.videoeditor.audioDescription.addAudioDescriptionMessage',
    defaultMessage: 'Upload an audio description track that narrates visual elements of this video for visually impaired learners. When set, the player will use the AD track instead of the original audio.',
    description: 'Help message displayed when no audio description has been uploaded',
  },
  uploadingMessage: {
    id: 'authoring.videoeditor.audioDescription.uploadingMessage',
    defaultMessage: 'Uploading {fileName}…',
    description: 'Message displayed while an audio description file is being uploaded',
  },
  cancelUpload: {
    id: 'authoring.videoeditor.audioDescription.cancelUpload',
    defaultMessage: 'Cancel',
    description: 'Cancel button label shown during an in-progress audio description upload',
  },
  deleteAudioDescription: {
    id: 'authoring.videoeditor.audioDescription.delete',
    defaultMessage: 'Delete',
    description: 'Delete button label for an uploaded audio description file',
  },
  uploadAudioDescriptionError: {
    id: 'authoring.videoeditor.audioDescription.error.uploadError',
    defaultMessage: 'Failed to upload audio description. Please try again.',
    description: 'Message presented to user when audio description fails to upload',
  },
  fileSizeError: {
    id: 'authoring.videoeditor.audioDescription.error.fileSizeError',
    defaultMessage: 'Audio description files must be 500 MB or less. Please choose a smaller file.',
    description: 'Message presented when audio description file size exceeds 500 MB',
  },
  fileTypeError: {
    id: 'authoring.videoeditor.audioDescription.error.fileTypeError',
    defaultMessage: 'Unsupported audio file type. Please upload an MP3, M4A, WAV, AAC, OGG, or FLAC file.',
    description: 'Message presented when audio description file type is not supported',
  },
  durationWarning: {
    id: 'authoring.videoeditor.audioDescription.durationWarning',
    defaultMessage: 'The audio description length ({adDuration}) does not match the video length ({videoDuration}). The track will still play, but synchronization may drift.',
    description: 'Warning shown when audio description duration differs from video duration by more than 1 second',
  },
});

export default messages;
