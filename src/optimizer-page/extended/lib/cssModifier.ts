// Converts an enum value (e.g. a Severity or FindingType) into the
// lowercase, hyphenated suffix used by this package's scss modifier
// classes (e.g. "Content Quality" -> "content-quality").
export function toModifier(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}
