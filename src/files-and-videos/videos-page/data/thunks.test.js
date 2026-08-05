import { addVideoFile } from './thunks';
import * as api from './api';

describe('addVideoFile', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();
  const courseId = 'course-123';
  const mockFile = {
    name: 'mockName',
  };
  const uploadingIdsRef = { current: { uploadData: {} } };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('Should dispatch failed if url cannot be created.', async () => {
    jest.spyOn(api, 'addVideo').mockResolvedValue({
      status: 404,
    });

    await addVideoFile(courseId, [mockFile], undefined, uploadingIdsRef)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        fileName: mockFile.name,
      },
      type: 'videos/failAddVideo',
    });
  });
  it('Failed video upload dispatches updateEditStatus with failed, and sends the failure to the api', async () => {
    const videoStatusMock = jest.spyOn(api, 'sendVideoUploadStatus').mockResolvedValue({
      status: 200,
    });
    const mockEdxVideoId = 'iD';
    jest.spyOn(api, 'addVideo').mockResolvedValue({
      status: 200,
      data: {
        files: [
          { edxVideoId: mockEdxVideoId, uploadUrl: 'a Url' },
        ],
      },
    });
    jest.spyOn(api, 'uploadVideo').mockResolvedValue({
      status: 404,
    });
    await addVideoFile(courseId, [mockFile], undefined, uploadingIdsRef)(dispatch, getState);
    expect(videoStatusMock).toHaveBeenCalledWith(courseId, mockEdxVideoId, 'Upload failed', 'upload_failed');
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        error: 'add',
        message: `Failed to upload ${mockFile.name}.`,
      },

      type: 'videos/updateErrors',
    });
  });
  it('Successful video upload sends the success to the api', async () => {
    const videoStatusMock = jest.spyOn(api, 'sendVideoUploadStatus').mockResolvedValue({
      status: 200,
    });
    const mockEdxVideoId = 'iD';
    jest.spyOn(api, 'addVideo').mockResolvedValue({
      status: 200,
      data: {
        files: [
          { edxVideoId: mockEdxVideoId, uploadUrl: 'a Url' },
        ],
      },
    });
    jest.spyOn(api, 'uploadVideo').mockResolvedValue({
      status: 200,
    });
    await addVideoFile(courseId, [mockFile], undefined, uploadingIdsRef)(dispatch, getState);
    expect(videoStatusMock).toHaveBeenCalledWith(courseId, mockEdxVideoId, 'Upload completed', 'upload_completed');
  });

  describe('polling for video status after upload', () => {
    const mockEdxVideoId = 'polling-id';
    const baseVideo = {
      edxVideoId: mockEdxVideoId,
      clientVideoId: mockFile.name,
      created: new Date().toString(),
      courseVideoImageUrl: null,
      transcripts: [],
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(api, 'addVideo').mockResolvedValue({
        status: 200,
        data: {
          files: [
            { edxVideoId: mockEdxVideoId, uploadUrl: 'a Url' },
          ],
        },
      });
      jest.spyOn(api, 'uploadVideo').mockResolvedValue({ status: 200 });
      jest.spyOn(api, 'sendVideoUploadStatus').mockResolvedValue({ status: 200 });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not poll when the freshly uploaded video is already resolved', async () => {
      const fetchVideoListMock = jest.spyOn(api, 'fetchVideoList').mockResolvedValue({
        videos: [{ ...baseVideo, status: 'Ready' }],
      });

      await addVideoFile(courseId, [mockFile], [], uploadingIdsRef)(dispatch, getState);
      await jest.advanceTimersByTimeAsync(10000);

      // Only the initial fetchVideoList call inside addVideoFile, no poll follow-up.
      expect(fetchVideoListMock).toHaveBeenCalledTimes(1);
    });

    it('polls until a pending video resolves, then dispatches updateModels', async () => {
      const fetchVideoListMock = jest.spyOn(api, 'fetchVideoList')
        .mockResolvedValueOnce({ videos: [{ ...baseVideo, status: 'Uploading' }] })
        .mockResolvedValueOnce({ videos: [{ ...baseVideo, status: 'In Progress' }] })
        .mockResolvedValueOnce({ videos: [{ ...baseVideo, status: 'Ready' }] });

      await addVideoFile(courseId, [mockFile], [], uploadingIdsRef)(dispatch, getState);
      expect(fetchVideoListMock).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(10000);
      expect(fetchVideoListMock).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(10000);
      expect(fetchVideoListMock).toHaveBeenCalledTimes(3);

      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'models/updateModels',
        payload: expect.objectContaining({
          modelType: 'videos',
          models: expect.arrayContaining([
            expect.objectContaining({ id: mockEdxVideoId, status: 'Ready' }),
          ]),
        }),
      }));

      // Resolved video means no further polling.
      dispatch.mockClear();
      await jest.advanceTimersByTimeAsync(10000);
      expect(fetchVideoListMock).toHaveBeenCalledTimes(3);
    });

    it('retries after a transient fetchVideoList error instead of stopping', async () => {
      const fetchVideoListMock = jest.spyOn(api, 'fetchVideoList')
        .mockResolvedValueOnce({ videos: [{ ...baseVideo, status: 'Uploading' }] })
        .mockRejectedValueOnce(new Error('network blip'))
        .mockResolvedValueOnce({ videos: [{ ...baseVideo, status: 'Ready' }] });

      await addVideoFile(courseId, [mockFile], [], uploadingIdsRef)(dispatch, getState);

      await jest.advanceTimersByTimeAsync(10000);
      expect(fetchVideoListMock).toHaveBeenCalledTimes(2);

      // Despite the error above, polling should continue rather than stop permanently.
      await jest.advanceTimersByTimeAsync(10000);
      expect(fetchVideoListMock).toHaveBeenCalledTimes(3);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'models/updateModels',
        payload: expect.objectContaining({
          modelType: 'videos',
          models: expect.arrayContaining([
            expect.objectContaining({ id: mockEdxVideoId, status: 'Ready' }),
          ]),
        }),
      }));
    });
  });
});
