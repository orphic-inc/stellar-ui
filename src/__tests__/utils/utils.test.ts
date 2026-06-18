import {
  formatDate,
  readableTime,
  formatBytes,
  ordinalSuffix,
  parseSize,
  formatSize
} from '../../utils';

describe('formatDate', () => {
  it('returns empty string for undefined input', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(formatDate('')).toBe('');
  });

  it('formats a valid date string', () => {
    const result = formatDate('2024-06-15T00:00:00Z');
    expect(result).toMatch(/Jun|June/);
    expect(result).toMatch(/2024/);
  });
});

describe('readableTime', () => {
  it('returns empty string for undefined input', () => {
    expect(readableTime(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(readableTime('')).toBe('');
  });

  it('returns "just now" for very recent dates', () => {
    const recent = new Date(Date.now() - 30000).toISOString();
    expect(readableTime(recent)).toBe('just now');
  });

  it('returns minutes ago for dates less than 1 hour old', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(readableTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('returns hours ago for dates less than 24 hours old', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(readableTime(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days ago for dates less than 30 days old', () => {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000
    ).toISOString();
    expect(readableTime(threeDaysAgo)).toBe('3d ago');
  });

  it('returns formatted date for dates older than 30 days', () => {
    const twoMonthsAgo = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000
    ).toISOString();
    const result = readableTime(twoMonthsAgo);
    expect(result).toMatch(/\d{4}/);
  });
});

describe('ordinalSuffix', () => {
  it('uses st for 1, 21, 31', () => {
    expect(ordinalSuffix(1)).toBe('1st');
    expect(ordinalSuffix(21)).toBe('21st');
    expect(ordinalSuffix(31)).toBe('31st');
  });

  it('uses nd for 2, 22, 32', () => {
    expect(ordinalSuffix(2)).toBe('2nd');
    expect(ordinalSuffix(22)).toBe('22nd');
  });

  it('uses rd for 3, 23, 33', () => {
    expect(ordinalSuffix(3)).toBe('3rd');
    expect(ordinalSuffix(23)).toBe('23rd');
  });

  it('uses th for 4-20 (including teens)', () => {
    expect(ordinalSuffix(4)).toBe('4th');
    expect(ordinalSuffix(11)).toBe('11th');
    expect(ordinalSuffix(12)).toBe('12th');
    expect(ordinalSuffix(13)).toBe('13th');
    expect(ordinalSuffix(20)).toBe('20th');
  });

  it('uses th for 111, 112, 113 (teen rule takes priority)', () => {
    expect(ordinalSuffix(111)).toBe('111th');
    expect(ordinalSuffix(112)).toBe('112th');
    expect(ordinalSuffix(113)).toBe('113th');
  });

  it('handles 100th correctly', () => {
    expect(ordinalSuffix(100)).toBe('100th');
  });
});

describe('formatBytes', () => {
  it('returns "0 B" for undefined input', () => {
    expect(formatBytes(undefined)).toBe('0 B');
  });

  it('returns "0 B" for 0', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512.00 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.00 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.00 GB');
  });
});

describe('parseSize', () => {
  it('returns null for empty or whitespace input', () => {
    expect(parseSize('')).toBeNull();
    expect(parseSize('   ')).toBeNull();
  });

  it('interprets a bare number as the default unit', () => {
    expect(parseSize('500', 'MiB')).toBe(500 * 1024 ** 2);
    expect(parseSize('2', 'GiB')).toBe(2 * 1024 ** 3);
  });

  it('defaults to bytes when no unit is given or selected', () => {
    expect(parseSize('1024')).toBe(1024);
  });

  it('parses a natural string, overriding the default unit', () => {
    expect(parseSize('4.5 GiB', 'MiB')).toBe(Math.round(4.5 * 1024 ** 3));
    expect(parseSize('85.4 MiB')).toBe(Math.round(85.4 * 1024 ** 2));
  });

  it('is case-insensitive and tolerates missing space', () => {
    expect(parseSize('1gib')).toBe(1024 ** 3);
    expect(parseSize('1 TIB')).toBe(1024 ** 4);
  });

  it('treats SI shorthand (KB/MB/GB/TB) as binary', () => {
    expect(parseSize('1 MB')).toBe(1024 ** 2);
    expect(parseSize('1 GB')).toBe(1024 ** 3);
  });

  it('returns null for malformed input', () => {
    expect(parseSize('abc')).toBeNull();
    expect(parseSize('1.2.3 GiB')).toBeNull();
    expect(parseSize('-5 MiB')).toBeNull();
  });

  it('returns null for an unrecognized unit', () => {
    expect(parseSize('5 PB')).toBeNull();
  });

  it('returns null when the result exceeds Number.MAX_SAFE_INTEGER', () => {
    expect(parseSize('999999 TiB')).toBeNull();
    expect(parseSize(`${Number.MAX_SAFE_INTEGER} B`)).toBe(
      Number.MAX_SAFE_INTEGER
    );
    expect(parseSize(`${Number.MAX_SAFE_INTEGER + 1} B`)).toBeNull();
  });
});

describe('formatSize', () => {
  it('returns "0 B" for falsy or negative input', () => {
    expect(formatSize(undefined)).toBe('0 B');
    expect(formatSize(null)).toBe('0 B');
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(-5)).toBe('0 B');
  });

  it('keeps sub-KiB values in whole bytes', () => {
    expect(formatSize(512)).toBe('512 B');
  });

  it('uses binary unit labels', () => {
    expect(formatSize(1024)).toBe('1 KiB');
    expect(formatSize(1024 ** 2)).toBe('1 MiB');
    expect(formatSize(1024 ** 3)).toBe('1 GiB');
    expect(formatSize(1024 ** 4)).toBe('1 TiB');
  });

  it('trims trailing zeros', () => {
    expect(formatSize(Math.round(4.5 * 1024 ** 3))).toBe('4.5 GiB');
    expect(formatSize(2 * 1024 ** 2)).toBe('2 MiB');
  });
});

describe('parseSize / formatSize round-trips', () => {
  it.each(['4.5 GiB', '85.4 MiB', '1 TiB', '512 B', '2 GiB'])(
    'round-trips %s',
    (input) => {
      const bytes = parseSize(input);
      expect(bytes).not.toBeNull();
      expect(formatSize(bytes)).toBe(input);
    }
  );
});
