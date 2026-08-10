import { Stack } from '@openedx/paragon';
import { FAMILY_DESCRIPTION, FAMILY_LABEL, type BlockFamily } from '../lib/blockTypeFamily';
import './TimelineLegend.scss';

const FAMILIES: BlockFamily[] = ['passive', 'active', 'neutral'];

export const TimelineLegend = () => (
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
  </Stack>
);
