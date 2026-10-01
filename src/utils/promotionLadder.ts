import type { components } from '../types/api';

type LadderRank = Pick<
  components['schemas']['UserRank'],
  'id' | 'level' | 'secondary' | 'autoManaged'
>;

/**
 * The rank a promotion rule out of `from` must point at (#383): the
 * auto-managed rank with the lowest level above it. The api accepts no other
 * target (stellar-api `validatePromotionRulePair`), and its sweep ignores any
 * rule that is not this step (stellar-api#718).
 *
 * Only `autoManaged` ranks are on the ladder: not a secondary rank, and not a
 * staff rank (stellar-api#866). The api owns that threshold; the ui reads the
 * flag and never copies the level (#425).
 *
 * Null when `from` is not auto-managed or is the top rung. Levels are unique
 * across all ranks (`@@unique([level])`), so two ranks never tie.
 */
export const nextRung = <R extends LadderRank>(
  from: LadderRank,
  ranks: readonly R[]
): R | null => {
  if (!from.autoManaged) return null;
  let next: R | null = null;
  for (const r of ranks) {
    if (!r.autoManaged || r.level <= from.level) continue;
    if (!next || r.level < next.level) next = r;
  }
  return next;
};

type LadderRule = Pick<
  components['schemas']['PromotionRule'],
  'fromRankId' | 'toRankId'
>;

/**
 * Where a rank stands for the promotion editor (#383). The api's unique key is
 * the (fromRankId, toRankId) pair, so a rank can hold several outgoing rules:
 * `current` is the one to the next rung, and every other is `outOfDate`.
 */
export const promotionPosition = <R extends LadderRank, P extends LadderRule>(
  fromRankId: number,
  ranks: readonly R[] = [],
  rules: readonly P[] = []
) => {
  const from = ranks.find((r) => r.id === fromRankId);
  const next = from ? nextRung(from, ranks) : null;
  const leaving = rules.filter((r) => r.fromRankId === fromRankId);
  const current = next
    ? leaving.find((r) => r.toRankId === next.id)
    : undefined;
  return {
    secondary: from?.secondary ?? false,
    autoManaged: from?.autoManaged ?? false,
    next,
    current,
    outOfDate: leaving.filter((r) => r !== current)
  };
};

type PromotionRule = components['schemas']['PromotionRule'];

/** What a rank save reported that staff should see before leaving the page. */
export interface RankSaveOutcome {
  staleRules: PromotionRule[];
  /** The new `autoManaged` when the save flipped it (#425); otherwise null. */
  flippedTo: boolean | null;
}

export const NOTHING_TO_REPORT: RankSaveOutcome = {
  staleRules: [],
  flippedTo: null
};

/**
 * Compare a rank before and after a save (#383, #425). A save that strands
 * promotion rules, or moves the rank on or off the auto-managed ladder, keeps
 * the page open; anything else returns to the list.
 */
export const rankSaveOutcome = (
  before: { autoManaged?: boolean } | undefined,
  saved: { autoManaged: boolean; staleRules?: PromotionRule[] }
): RankSaveOutcome => ({
  staleRules: saved.staleRules ?? [],
  flippedTo:
    before?.autoManaged !== undefined &&
    before.autoManaged !== saved.autoManaged
      ? saved.autoManaged
      : null
});

export const hasSomethingToReport = (outcome: RankSaveOutcome) =>
  outcome.staleRules.length > 0 || outcome.flippedTo !== null;
