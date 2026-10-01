import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PROMOTION_SECTION_ID } from './PromotionCriteriaSection';
import {
  hasSomethingToReport,
  type RankSaveOutcome
} from '../../utils/promotionLadder';

/**
 * Shown after a rank save that changed more than the rank itself. The api saved
 * the change and reports two kinds of consequence:
 *
 * - `staleRules` (#383, stellar-api#718): promotion rules the change took off
 *   the ladder. They no longer fire, and each link opens the promotion section
 *   of the rank the rule leaves, where it can be deleted or replaced.
 * - an `autoManaged` flip (#425, stellar-api#866): the rank moved on or off the
 *   auto-managed ladder, which changes three jobs for everyone holding it.
 *
 * It renders at the top of a long page while the Save button sits at the
 * bottom, so it scrolls itself into view when it appears.
 */
const RankSaveNotice = ({ outcome }: { outcome: RankSaveOutcome }) => {
  const ref = useRef<HTMLDivElement>(null);
  const shown = hasSomethingToReport(outcome);
  useEffect(() => {
    if (shown) ref.current?.scrollIntoView?.({ block: 'center' });
  }, [shown, outcome]);

  if (!shown) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className="text-sm rounded border border-[var(--st-warning)] px-3 py-2 text-[var(--st-warning)] space-y-2"
    >
      <p>Saved.</p>
      {outcome.flippedTo !== null && <FlipNote to={outcome.flippedTo} />}
      {outcome.staleRules.length > 0 && <StaleRules outcome={outcome} />}
      <p>
        <Link to="/staff/tools/user-ranks" className="underline">
          Back to User Ranks
        </Link>
      </p>
    </div>
  );
};

/** The three jobs named in stellar-api#866's `autoManaged` description. */
const FlipNote = ({ to }: { to: boolean }) => {
  return to ? (
    <p>
      This rank is now auto-managed. Members holding it as their primary rank
      are now auto-promoted and demoted, disabled for inactivity, and granted
      invites by the handout.
    </p>
  ) : (
    <p>
      This rank is no longer auto-managed. Members holding it as their primary
      rank are no longer auto-promoted or demoted, disabled for inactivity, or
      granted invites by the handout.
    </p>
  );
};

const StaleRules = ({ outcome }: { outcome: RankSaveOutcome }) => {
  return (
    <>
      <p>
        This change took these promotion rules off the ladder, so they no longer
        fire:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        {outcome.staleRules.map((rule) => (
          <li key={rule.id}>
            <Link
              to={`/staff/tools/user-ranks/${rule.fromRankId}/edit#${PROMOTION_SECTION_ID}`}
              className="underline"
            >
              {rule.fromRankName ?? `Rank #${rule.fromRankId}`} →{' '}
              {rule.toRankName ?? `rank #${rule.toRankId}`}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default RankSaveNotice;
