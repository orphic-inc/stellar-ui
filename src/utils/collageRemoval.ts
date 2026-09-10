import type { CollageEntry } from '../store/services/collageApi';

export interface EntryCopy {
  releaseId: number;
  userId: number;
}

/**
 * Every collage entry a single visible row stands for (#319): the
 * representative, plus each entry the api folded into it because they share a
 * release group.
 *
 * `userId` travels with each copy because delete permission is **per row** —
 * the collage owner, that row's own adder, or staff — and two entries collapsed
 * onto one line can have two different adders.
 */
export const collapsedCopies = (entry: CollageEntry): EntryCopy[] => [
  { releaseId: entry.releaseId, userId: entry.userId },
  ...(entry.groupedWith ?? []).map((m) => ({
    releaseId: m.releaseId,
    userId: m.userId
  }))
];

/**
 * What to ask before removing a collapsed row.
 *
 * The removable subset is computed before anything is sent, so the message can
 * state the outcome up front — a partial removal is then consented to rather
 * than discovered. The three cases are genuinely different questions:
 *
 *   1 copy                  the row is one entry; the original wording stands
 *   all copies removable    say how many will go, so "remove" is not a surprise
 *   some copies removable   say what will be left behind, and why
 */
export const removalConfirmMessage = (
  title: string,
  total: number,
  removable: number
): string => {
  if (total === 1) return 'Remove this release from the collage?';
  const head = `Remove “${title}” from the collage?\n\n`;
  if (removable === total) {
    return `${head}It is held here under ${total} releases — all ${total} will be removed.`;
  }
  return (
    `${head}It is held here under ${total} releases. You can remove ` +
    `${removable} — the rest were added by other members and will stay.`
  );
};

/**
 * What to say when a removal fails partway through a collapsed row.
 *
 * `429` is called out because the whole-album remove issues one request per
 * copy, and the loop stops on it rather than firing the rest into the same
 * limit — so the member needs to know some copies remain and that retrying is
 * the right response. Everything else, including the `403` a locked collage
 * produces (which the client-side predicate cannot foresee), reads the same.
 */
export const removalFailureMessage = (err: unknown): string =>
  (err as { status?: number })?.status === 429
    ? 'Too many requests — some copies were not removed. Try again shortly.'
    : 'Failed to remove entry.';
