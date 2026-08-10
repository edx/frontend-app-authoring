// Frontend-local mapping from raw OLX block_type to a coloring family for the
// timeline/legend. This is separate from (and finer-grained than) the
// backend's ContentCategory in types/courseReport.ts — that's a 6-value
// taxonomy for grouping, this is a 3-value Passive/Active/Neutral split
// purely for timeline color. Update this table, not the backend model, if
// the block_type list changes.

export type BlockFamily = 'passive' | 'active' | 'neutral';

const PASSIVE = new Set(['html', 'video', 'videoalpha']);
const ACTIVE = new Set([
  'problem',
  'discussion',
  'drag-and-drop-v2',
  'openassessment',
  'poll_question',
  'word_cloud',
  'annotatable',
  'itembank',
]);
const NEUTRAL = new Set([
  'lti',
  'conditional',
  'split_test',
  'randomize',
  'library_content',
  'hidden',
]);

export function familyForBlockType(blockType: string): BlockFamily {
  if (PASSIVE.has(blockType)) { return 'passive'; }
  if (ACTIVE.has(blockType)) { return 'active'; }
  if (NEUTRAL.has(blockType)) { return 'neutral'; }
  return 'neutral'; // any unrecognized type
}

export const FAMILY_LABEL: Record<BlockFamily, string> = {
  passive: 'Passive',
  active: 'Active',
  neutral: 'Neutral',
};

export const FAMILY_DESCRIPTION: Record<BlockFamily, string> = {
  passive: 'consuming',
  active: 'doing',
  neutral: 'structural / non-content',
};

// The set of block_type values with their own modifier class in
// ../styles/_shared.scss (.cor-tile--block-*); anything outside this set
// falls back to .cor-tile--block-neutral.
const KNOWN_BLOCK_TYPES = new Set([
  'html', 'video', 'videoalpha', 'problem', 'discussion', 'drag-and-drop-v2',
  'openassessment', 'poll_question', 'word_cloud', 'annotatable', 'itembank',
]);

// Modifier suffix for a tile's background color, matching a
// .cor-tile--block-* class in ../styles/_shared.scss.
export function blockTypeModifier(blockType: string): string {
  return KNOWN_BLOCK_TYPES.has(blockType) ? blockType : 'neutral';
}

export function labelForBlockType(blockType: string): string {
  return blockType
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
