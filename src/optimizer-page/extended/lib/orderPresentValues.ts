// Known values always appear first, in their preferred order; any value
// present in the data but outside that known set (e.g. a new backend-added
// severity or category) is appended after, using its own raw value.
export function orderPresentValues<T extends string>(known: readonly T[], present: T[]): T[] {
  const extras = Array.from(new Set(present.filter((v) => !known.includes(v))));
  return [...known, ...extras];
}

// Ranks a value by its position in `known`, worst-to-best; anything outside
// `known` ranks after all known values instead of sorting first (the
// default behavior of an indexOf-based comparator on a -1 "not found").
export function rankAgainst<T extends string>(known: readonly T[], value: T): number {
  const idx = known.indexOf(value);
  return idx === -1 ? known.length : idx;
}
