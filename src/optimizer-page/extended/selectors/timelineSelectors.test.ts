import { courseReportFixture } from '../data/courseReportFixture';
import { selectTimeline } from './timelineSelectors';

describe('selectTimeline', () => {
  it('returns empty timeline for an undefined report', () => {
    const timeline = selectTimeline(undefined);
    expect(timeline.sections).toEqual([]);
    expect(timeline.totalMinutes).toBe(0);
  });

  it('lays out one section per course sectionId, in order', () => {
    const timeline = selectTimeline(courseReportFixture);
    expect(timeline.sections.map((s) => s.sectionId)).toEqual(['sec-intro', 'sec-stats']);
  });

  it('carries a section\'s learning_balance flags through to the timeline section', () => {
    const timeline = selectTimeline(courseReportFixture);
    const introSection = timeline.sections.find((s) => s.sectionId === 'sec-intro');
    expect(introSection?.flags).toEqual(['low_active_engagement']);
  });

  it('produces one tile per component, summing to the section/grand totals', () => {
    const timeline = selectTimeline(courseReportFixture);
    const totalTileMinutes = timeline.sections
      .flatMap((s) => s.tiles)
      .reduce((sum, t) => sum + t.minutes, 0);
    expect(totalTileMinutes).toBeCloseTo(courseReportFixture.time_summary.total_minutes, 5);
    expect(timeline.totalMinutes).toBeCloseTo(courseReportFixture.time_summary.total_minutes, 5);
  });

  it('lays tiles out end-to-end with non-overlapping, increasing x positions', () => {
    const timeline = selectTimeline(courseReportFixture);
    const allTiles = timeline.sections.flatMap((s) => s.tiles);
    for (let i = 1; i < allTiles.length; i += 1) {
      expect(allTiles[i].x).toBeGreaterThanOrEqual(allTiles[i - 1].x + allTiles[i - 1].width);
    }
  });
});
