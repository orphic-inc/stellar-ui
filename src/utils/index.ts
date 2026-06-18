export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const readableTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
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
// to type by hand — the natural-string parser still accepts a bare "B").
export const SIZE_INPUT_UNITS: BinarySizeUnit[] = ['KiB', 'MiB', 'GiB', 'TiB'];

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
