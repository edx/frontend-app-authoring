// Rounds the whole value first, then splits into hours/minutes — rounding
// each part separately (e.g. floor(minutes/60) then round the remainder) can
// push the remainder to 60 (e.g. "1h 60m") once the two roundings disagree
// near an hour boundary.
function formatMinutesWithPrecision(minutes: number, decimals: number): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(minutes * factor) / factor;
  const hours = Math.floor(rounded / 60);
  const remainder = Math.round((rounded - hours * 60) * factor) / factor;
  if (hours <= 0) { return `${rounded} min`; }
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

// Summary/rollup contexts (SummaryBar totals, per-section and grand totals)
// where sub-minute precision on an aggregate reads as noise.
export function formatMinutesRounded(minutes: number): string {
  return formatMinutesWithPrecision(minutes, 0);
}

// Individual-component contexts (tile tooltips, aria-labels) where showing
// precise sub-minute estimates is meaningful.
export function formatMinutesPrecise(minutes: number): string {
  return formatMinutesWithPrecision(minutes, 2);
}
