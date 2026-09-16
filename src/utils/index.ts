export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * A date as a short distance from now: `2h ago` behind, `in 2d` ahead. Dates
 * ahead used to fall into the "just now" branch, so an invite expiring in three
 * days read as if it had only now happened (stellar-ui#331).
 */
export const readableTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(Math.abs(diff) / 60000);
  const ahead = diff < 0;
  const since = (value: string) => (ahead ? `in ${value}` : `${value} ago`);
  if (mins < 1) return ahead ? 'in under a minute' : 'just now';
  if (mins < 60) return since(`${mins}m`);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return since(`${hrs}h`);
  const days = Math.floor(hrs / 24);
  if (days < 30) return since(`${days}d`);
  return formatDate(dateStr);
};

/** The same distance in prose, for a sentence: `in 2 days`, `in 5 hours`. */
export const untilTime = (dateStr?: string): string => {
  if (!dateStr) return 'shortly';
  const ms = new Date(dateStr).getTime() - Date.now();
  if (ms <= 0) return 'shortly';
  const plural = (value: number, unit: string) =>
    `in ${value} ${unit}${value === 1 ? '' : 's'}`;
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 1) return plural(Math.max(1, Math.floor(ms / 60000)), 'minute');
  if (hrs < 24) return plural(hrs, 'hour');
  return plural(Math.floor(hrs / 24), 'day');
};

export const formatBytes = (bytes?: number): string => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Binary (1024-based) size units, smallest to largest.
export const BINARY_SIZE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB'] as const;
export type BinarySizeUnit = (typeof BINARY_SIZE_UNITS)[number];

// Units offered in the contribution form's unit selector (bytes is too granular
// to type by hand — the natural-string parser still accepts a bare "B"). TiB is
// deliberately excluded: no ReleaseType upload-size cap permits a TiB-scale
// release, so offering it only invites an always-rejected value (#99). TiB stays
// in BINARY_SIZE_UNITS so formatSize can still render large *existing* sizes.
export const SIZE_INPUT_UNITS: BinarySizeUnit[] = ['KiB', 'MiB', 'GiB'];

// Multipliers for every unit token parseSize recognizes. SI shorthands (KB, MB,
// …) are treated as binary too, since that's what users usually mean here.
const SIZE_UNIT_MULTIPLIERS: Record<string, number> = {
  b: 1,
  k: 1024,
  kb: 1024,
  kib: 1024,
  m: 1024 ** 2,
  mb: 1024 ** 2,
  mib: 1024 ** 2,
  g: 1024 ** 3,
  gb: 1024 ** 3,
  gib: 1024 ** 3,
  t: 1024 ** 4,
  tb: 1024 ** 4,
  tib: 1024 ** 4
};

/**
 * Parse a human-entered size into a byte count.
 *
 * Accepts a bare number (interpreted as `defaultUnit`) or a value with a unit
 * suffix, e.g. `"4.5 GiB"`. A unit in the string overrides `defaultUnit`.
 * Returns `null` when the input is empty, malformed, negative, has an
 * unrecognized unit, or exceeds `Number.MAX_SAFE_INTEGER` (the backend Zod cap).
 */
export const parseSize = (
  input: string,
  defaultUnit: BinarySizeUnit = 'B'
): number | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 0) return null;
  const unitToken = (match[2] ?? defaultUnit).toLowerCase();
  const multiplier = SIZE_UNIT_MULTIPLIERS[unitToken];
  if (multiplier === undefined) return null;
  const bytes = Math.round(value * multiplier);
  if (bytes > Number.MAX_SAFE_INTEGER) return null;
  return bytes;
};

/**
 * Format a byte count as a human-readable binary string, e.g. `"4.5 GiB"`.
 * Trailing zeros are trimmed (`2 GiB`, not `2.00 GiB`); sub-KiB values stay in
 * whole bytes.
 */
export const formatSize = (bytes?: number | null): string => {
  if (!bytes || bytes < 0) return '0 B';
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BINARY_SIZE_UNITS.length - 1
  );
  if (i === 0) return `${bytes} B`;
  const value = bytes / Math.pow(1024, i);
  const formatted = value.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted} ${BINARY_SIZE_UNITS[i]}`;
};

export const ordinalSuffix = (n: number): string => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};
