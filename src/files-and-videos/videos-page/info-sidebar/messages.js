import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  infoTabTitle: {
    id: 'course-authoring.video-uploads.file-info.infoTab.title',
    defaultMessage: 'Info',
    description: 'Title for info tab',
  },
  transcriptTabTitle: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.title',
    defaultMessage: 'Transcripts ({transcriptCount})',
    description: 'Title for info tab',
  },
  notificationScreenReaderText: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.notification.screenReader.text',
    defaultMessage: 'Transcription error',
    description: 'Scrren reader text for transcript tab notification',
  },
  dateAddedTitle: {
    id: 'course-authoring.video-uploads.file-info.infoTab.dateAdded.title',
    defaultMessage: 'Date added',
    description: 'Title for date added section',
  },
  fileSizeTitle: {
    id: 'course-authoring.video-uploads.file-info.infoTab.fileSize.title',
    defaultMessage: 'File size',
    description: 'Title for file size section',
  },
  videoLengthTitle: {
    id: 'course-authoring.video-uploads.file-info.infoTab.videoLength.title',
    defaultMessage: 'Video length',
    description: 'Title for video length section',
  },
  errorAlertMessage: {
    id: 'course-authoring.files-and-upload.file-info.transcriptTab.errorAlert.message',
    defaultMessage: '{message}',
  },
  uploadButtonLabel: {
    id: 'course-authoriong.video-uploads.file-info.transcriptTab.upload.label',
    defaultMessage: 'Add a transcript',
    description: 'Label for upload button',
  },
  transcriptFileTooLarge: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.fileTooLarge',
    defaultMessage: 'Transcript file exceeds the 25 MB limit.',
    description: 'Error shown when a selected transcript file is over the size cap.',
  },
  transcriptUploadedToast: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.uploadedToast',
    defaultMessage: 'New transcript added',
    description: 'Toast shown after a transcript is successfully uploaded.',
  },
  transcriptDeletedToast: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.deletedToast',
    defaultMessage: 'Transcript deleted',
    description: 'Toast shown after a transcript is successfully deleted.',
  },
  newTranscriptHeading: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.heading',
    defaultMessage: 'New transcript',
    description: 'Heading for the new transcript form.',
  },
  uploadFileButton: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.uploadButton',
    defaultMessage: 'Upload file',
    description: 'Label for upload file button in new transcript form.',
  },
  uploadFileHint: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.uploadHint',
    defaultMessage: 'SRT file, max 25MB',
    description: 'Hint text for upload file size and format.',
  },
  cancelLabel: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button in new transcript form.',
  },
  addTranscriptLabel: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.add',
    defaultMessage: 'Add transcript',
    description: 'Submit button in new transcript form.',
  },
  clearFileLabel: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.clearFile',
    defaultMessage: 'Remove selected file',
    description: 'Aria label for the trash icon that removes the selected transcript file.',
  },
  uploadFailedError: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.uploadFailed',
    defaultMessage: 'Upload failed, please try again',
    description: 'Error shown when transcript upload fails.',
  },
  emptyFileError: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.emptyFile',
    defaultMessage: 'File is empty, please select a valid SRT file',
    description: 'Error shown when an empty file is selected.',
  },
  invalidFileError: {
    id: 'course-authoring.video-uploads.file-info.transcriptTab.newTranscript.invalidFile',
    defaultMessage: 'Invalid subtitle file',
    description: 'Error shown when the selected file is not a valid SRT subtitle file.',
  },
});

export default messages;
