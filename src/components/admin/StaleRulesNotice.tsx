import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { components } from '../../types/api';
import { PROMOTION_SECTION_ID } from './PromotionCriteriaSection';

type PromotionRule = components['schemas']['PromotionRule'];

/**
 * Shown after a rank save that took promotion rules off the ladder (#383). The
 * api saved the change and reported the rules (`staleRules`, stellar-api#718);
 * they no longer fire, and each link opens the promotion section of the rank
 * the rule leaves, where it can be deleted or replaced.
 *
 * It renders at the top of a long page while the Save button sits at the
 * bottom, so it scrolls itself into view when it appears.
 */
const StaleRulesNotice = ({ rules }: { rules: PromotionRule[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rules.length > 0) ref.current?.scrollIntoView?.({ block: 'center' });
  }, [rules]);

  if (rules.length === 0) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className="text-sm rounded border border-[var(--st-warning)] px-3 py-2 text-[var(--st-warning)] space-y-2"
    >
      <p>
        Saved. This change took these promotion rules off the ladder, so they no
        longer fire:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        {rules.map((rule) => (
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
      <p>
        <Link to="/staff/tools/user-ranks" className="underline">
          Back to User Ranks
        </Link>
      </p>
    </div>
  );
};

export default StaleRulesNotice;
