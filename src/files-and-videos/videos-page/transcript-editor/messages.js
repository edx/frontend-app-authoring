import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  modalTitle: {
    id: 'course-authoring.video-uploads.transcript-editor.modalTitle',
    defaultMessage: 'Edit transcript',
    description: 'Title of the in-platform transcript editor modal.',
  },
  closeLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.closeLabel',
    defaultMessage: 'Close',
    description: 'Close button label for the transcript editor modal.',
  },
  statusSaving: {
    id: 'course-authoring.video-uploads.transcript-editor.statusSaving',
    defaultMessage: 'Saving…',
    description: 'Status / button label shown while a save request is in flight.',
  },
  statusSaved: {
    id: 'course-authoring.video-uploads.transcript-editor.statusSaved',
    defaultMessage: 'Saved',
    description: 'Header status shown when a save succeeds.',
  },
  statusError: {
    id: 'course-authoring.video-uploads.transcript-editor.statusError',
    defaultMessage: '⚠ Save failed: {detail}',
    description: 'Header status shown when a save fails.',
  },
  loading: {
    id: 'course-authoring.video-uploads.transcript-editor.loading',
    defaultMessage: 'Loading transcript…',
    description: 'Loading message while the SRT is being fetched.',
  },
  loadError: {
    id: 'course-authoring.video-uploads.transcript-editor.loadError',
    defaultMessage: 'Failed to load transcript.',
    description: 'Error shown when the SRT cannot be fetched.',
  },
  videoUnavailable: {
    id: 'course-authoring.video-uploads.transcript-editor.videoUnavailable',
    defaultMessage: 'Video preview is not available.',
    description: 'Fallback shown when no playable video URL is on the record.',
  },
  cueAriaLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.cueAriaLabel',
    defaultMessage: 'Transcript cue at {timestamp}',
    description: 'Accessible label for an editable transcript cue block.',
  },
  seekTooltip: {
    id: 'course-authoring.video-uploads.transcript-editor.seekTooltip',
    defaultMessage: 'Seek to {timestamp}',
    description: 'Tooltip on timestamp button that seeks the video preview.',
  },
  startTimeLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.startTimeLabel',
    defaultMessage: 'Start time',
    description: 'Aria label for the start time input on a cue.',
  },
  endTimeLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.endTimeLabel',
    defaultMessage: 'End time',
    description: 'Aria label for the end time input on a cue.',
  },
  deleteCueLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.deleteCueLabel',
    defaultMessage: 'Delete cue',
    description: 'Tooltip / aria label for the delete cue button.',
  },
  insertCueLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.insertCueLabel',
    defaultMessage: 'Insert cue here',
    description: 'Label for the inline button that inserts a new cue between existing ones.',
  },
  appendCueLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.appendCueLabel',
    defaultMessage: 'Add new cue',
    description: 'Label for the button at the end of the cue list that appends a new cue.',
  },
  emptyStateTitle: {
    id: 'course-authoring.video-uploads.transcript-editor.emptyStateTitle',
    defaultMessage: 'No transcript cues yet',
    description: 'Empty-state heading shown when the transcript file has no cues.',
  },
  emptyStateDescription: {
    id: 'course-authoring.video-uploads.transcript-editor.emptyStateDescription',
    defaultMessage: 'Click “Add new cue” below to create your first transcript line.',
    description: 'Empty-state help text shown when the transcript file has no cues.',
  },
  cueErrorEmpty: {
    id: 'course-authoring.video-uploads.transcript-editor.cueErrorEmpty',
    defaultMessage: 'Cue text cannot be empty.',
    description: 'Inline cue error: the cue text is blank.',
  },
  cueErrorBlankLine: {
    id: 'course-authoring.video-uploads.transcript-editor.cueErrorBlankLine',
    defaultMessage: 'Cue text cannot contain a blank line - empty lines split the SRT file into separate cues.',
    description: 'Inline cue error: the cue text contains a blank line.',
  },
  cueErrorLooksLikeIndex: {
    id: 'course-authoring.video-uploads.transcript-editor.cueErrorLooksLikeIndex',
    defaultMessage: 'Cue text cannot contain a line that is only a number - SRT uses bare numbers as cue indexes.',
    description: 'Inline cue error: the cue text contains a line that is just an integer.',
  },
  cueErrorLooksLikeTimestamp: {
    id: 'course-authoring.video-uploads.transcript-editor.cueErrorLooksLikeTimestamp',
    defaultMessage: 'Cue text cannot contain an SRT timestamp line.',
    description: 'Inline cue error: the cue text contains an SRT timestamp range.',
  },
  cueErrorEndBeforeStart: {
    id: 'course-authoring.video-uploads.transcript-editor.cueErrorEndBeforeStart',
    defaultMessage: 'End time must be after the start time.',
    description: 'Inline cue error: the cue end time is not after the start time.',
  },
  saveFailed: {
    id: 'course-authoring.video-uploads.transcript-editor.saveFailed',
    defaultMessage: 'Save failed',
    description: 'Generic fallback error shown when a save request fails without a specific message.',
  },
  cancelLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.cancelLabel',
    defaultMessage: 'Cancel',
    description: 'Label for the Cancel button in the transcript editor modal footer.',
  },
  saveLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.saveLabel',
    defaultMessage: 'Save',
    description: 'Label for the Save button in the transcript editor modal footer.',
  },
  confirmDiscardChanges: {
    id: 'course-authoring.video-uploads.transcript-editor.confirmDiscardChanges',
    defaultMessage: 'You have unsaved transcript changes. Discard them and close the editor?',
    description: 'Confirmation body text shown when the user tries to close the transcript editor with unsaved edits.',
  },
  confirmDiscardTitle: {
    id: 'course-authoring.video-uploads.transcript-editor.confirmDiscardTitle',
    defaultMessage: 'Discard unsaved changes?',
    description: 'Title of the discard-changes confirmation dialog.',
  },
  confirmDiscardLabel: {
    id: 'course-authoring.video-uploads.transcript-editor.confirmDiscardLabel',
    defaultMessage: 'Discard changes',
    description: 'Confirm button label in the discard-changes dialog.',
  },
});

export default messages;
