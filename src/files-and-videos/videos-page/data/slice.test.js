import {
  reducer,
  setVideoIds,
} from './slice';

describe('videos slice dedupe behavior', () => {
  it('deduplicates ids when setting the full list', () => {
    const state = reducer(undefined, setVideoIds({
      videoIds: ['video-1', 'video-2', 'video-1', 'video-3', 'video-2'],
    }));

    expect(state.videoIds).toEqual(['video-1', 'video-2', 'video-3']);
  });

  it('does not add a duplicate id when prepending a new video', () => {
    const state = reducer({
      ...reducer(undefined, { type: '@@INIT' }),
      videoIds: ['video-1', 'video-2'],
    }, {
      type: 'videos/addVideoById',
      payload: { videoId: 'video-1' },
    });

    expect(state.videoIds).toEqual(['video-1', 'video-2']);
  });

  it('prepends a new id once when it is not already present', () => {
    const state = reducer({
      ...reducer(undefined, { type: '@@INIT' }),
      videoIds: ['video-1', 'video-2'],
    }, {
      type: 'videos/addVideoById',
      payload: { videoId: 'video-3' },
    });

    expect(state.videoIds).toEqual(['video-3', 'video-1', 'video-2']);
  });
});
