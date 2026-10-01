import type { components } from '../types/api';

type LadderRank = Pick<
  components['schemas']['UserRank'],
  'id' | 'level' | 'secondary'
>;

/**
 * The rank a promotion rule out of `from` must point at (#383): the primary
 * rank with the lowest level above it. The api accepts no other target
 * (stellar-api `validatePromotionRulePair`), and its sweep ignores any rule that
 * is not this step (stellar-api#718).
 *
 * Null when `from` is secondary (off the ladder) or the top primary rung. Levels
 * are unique across all ranks (`@@unique([level])`), so two ranks never tie for
 * the next rung.
 */
export const nextRung = <R extends LadderRank>(
  from: LadderRank,
  ranks: readonly R[]
): R | null => {
  if (from.secondary) return null;
  let next: R | null = null;
  for (const r of ranks) {
    if (r.secondary || r.level <= from.level) continue;
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
    next,
    current,
    outOfDate: leaving.filter((r) => r !== current)
  };
};
