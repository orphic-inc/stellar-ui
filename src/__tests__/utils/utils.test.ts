import { formatDate, readableTime, formatBytes } from '../../utils';

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
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(readableTime(threeDaysAgo)).toBe('3d ago');
  });

  it('returns formatted date for dates older than 30 days', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const result = readableTime(twoMonthsAgo);
    expect(result).toMatch(/\d{4}/);
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
