import { useMemo, useState } from 'react';
import { Button } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useCourseReport } from '../context/CourseReportContext';
import { selectTimeline } from '../selectors/timelineSelectors';
import { formatMinutesRounded as fmtMinutes } from '../lib/formatMinutes';
import messages from '../messages';
import { FlagStrip } from './FlagStrip';
import { ModuleTimeline } from './ModuleTimeline';
import { TimelineLegend } from './TimelineLegend';
import { TimelineTileButton } from './TimelineTileButton';
import './ContentTimeline.scss';

type TimelineView = 'course' | 'module';

export const ContentTimeline = () => {
  const intl = useIntl();
  const report = useCourseReport();
  const timeline = useMemo(() => selectTimeline(report), [report]);
  const [view, setView] = useState<TimelineView>('course');
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  const grandTotalLabel = fmtMinutes(timeline.totalMinutes);

  return (
    <div className="content-timeline">
      <h3 className="content-timeline__heading">{intl.formatMessage(messages.timelineHeading)}</h3>
      <p className="content-timeline__description">
        {intl.formatMessage(messages.timelineDescription, { totalTime: grandTotalLabel })}
      </p>

      <div className="content-timeline__view-toggle">
        <Button
          variant={view === 'course' ? 'primary' : 'tertiary'}
          size="sm"
          aria-pressed={view === 'course'}
          onClick={() => setView('course')}
        >
          {intl.formatMessage(messages.timelineViewFullCourse)}
        </Button>
        <Button
          variant={view === 'module' ? 'primary' : 'tertiary'}
          size="sm"
          aria-pressed={view === 'module'}
          onClick={() => setView('module')}
        >
          {intl.formatMessage(messages.timelineViewBySection)}
        </Button>
      </div>

      <TimelineLegend />

      {view === 'course' ? (
        <div className="content-timeline__ribbon-scroll">
          <div className="content-timeline__ribbon" style={{ width: timeline.ribbonWidth }}>
            <div className="content-timeline__section-labels">
              {timeline.sections.map((section) => (
                <button
                  key={section.sectionId}
                  type="button"
                  aria-pressed={highlightedSectionId === section.sectionId}
                  className={`content-timeline__section-label ${highlightedSectionId === section.sectionId ? 'content-timeline__section-label--active' : ''}`}
                  style={{ left: section.x, width: section.width }}
                  title={`${section.title} · ${fmtMinutes(section.totalMinutes)}`}
                  onClick={() => setHighlightedSectionId(
                    (current) => (current === section.sectionId ? null : section.sectionId),
                  )}
                >
                  <span className="content-timeline__section-label-title">{section.title}</span>
                  <span className="content-timeline__section-label-time">{fmtMinutes(section.totalMinutes)}</span>
                </button>
              ))}
            </div>

            <div className="content-timeline__tiles">
              {timeline.sections.flatMap((section) => section.tiles.map((tile) => (
                <TimelineTileButton
                  key={tile.componentId}
                  tile={tile}
                  left={tile.x}
                  height={46}
                  dimmed={!!highlightedSectionId && highlightedSectionId !== section.sectionId}
                />
              )))}
            </div>

            <div className="content-timeline__ruler">
              {timeline.ticks.map((t) => (
                <div key={t.x} className="content-timeline__tick" style={{ left: t.x }}>
                  <div className={`content-timeline__tick-mark ${t.major ? 'content-timeline__tick-mark--major' : ''}`} />
                  {t.major && (
                    <span className="content-timeline__tick-label">{t.label}</span>
                  )}
                </div>
              ))}
            </div>

            <FlagStrip
              width={timeline.ribbonWidth}
              spans={timeline.sections.map((s) => ({ x: s.x, width: s.width, flags: s.flags }))}
            />
          </div>
        </div>
      ) : (
        <ModuleTimeline />
      )}
    </div>
  );
};
