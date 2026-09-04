import { Stack } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { FAMILY_DESCRIPTION, FAMILY_LABEL, type BlockFamily } from '../lib/blockTypeFamily';
import messages from '../messages';
import './TimelineLegend.scss';

const FAMILIES: BlockFamily[] = ['passive', 'active', 'neutral'];

export const TimelineLegend = () => {
  const intl = useIntl();
  return (
    <Stack direction="horizontal" gap={4} className="timeline-legend">
      {FAMILIES.map((family) => (
        <Stack
          direction="horizontal"
          gap={2}
          key={family}
          className={`timeline-legend__entry cor-legend__swatch--${family}`}
        >
          <strong className="timeline-legend__label">{FAMILY_LABEL[family]}</strong>
          <span className="timeline-legend__description">{FAMILY_DESCRIPTION[family]}</span>
        </Stack>
      ))}
      <Stack direction="horizontal" gap={2} className="timeline-legend__entry timeline-legend__entry--flag">
        <strong className="timeline-legend__label">{intl.formatMessage(messages.legendFlagLabel)}</strong>
        <span className="timeline-legend__description">{intl.formatMessage(messages.legendFlagDescription)}</span>
      </Stack>
    </Stack>
  );
};
