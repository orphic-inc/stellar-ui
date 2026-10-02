/**
 * The registry-space line on My stylesheets (#450). `limit` is the session's
 * `authorStylesheetLimit`: `null` unlimited, `0` none (stellar-api#881).
 * `used` is the list's total, which counts what the quota counts.
 */
export type StylesheetQuota = {
  line: string | null;
  /** Why New is disabled, or null when it isn't. */
  blocked: string | null;
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export const describeQuota = (
  used: number,
  limit: number | null
): StylesheetQuota => {
  if (limit === null) {
    return {
      line: `${plural(used, 'stylesheet', 'stylesheets')} (no limit)`,
      blocked: null
    };
  }
  if (limit === 0) {
    return {
      line: null,
      blocked: "Your class doesn't include stylesheet spaces."
    };
  }
  const line = `${used} of ${plural(limit, 'stylesheet space', 'stylesheet spaces')} used`;
  if (used < limit) return { line, blocked: null };
  return {
    line,
    blocked:
      limit === 1
        ? 'Your one space is in use. Deleting your stylesheet frees it.'
        : `All ${limit} spaces are in use. Deleting one frees a space.`
  };
};
