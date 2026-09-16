import {
  DisabledNotice,
  WatchNotice,
  DISABLED_CLASS,
  WATCH_CLASS,
  type RatioPolicyView
} from '../ratio/ratioPolicyCopy';

/**
 * The member-facing ratio policy notice on their own profile (stellar-api#646,
 * ADR-0044). The words live in `ratio/ratioPolicyCopy`, shared with the
 * site-wide banner (#345); this owns only the panel chrome and the decision to
 * lead with the numbers, which a full-width profile surface has room for.
 *
 * Presentational by design: `UserProfile` already holds the single
 * `getMyRatioStats` subscription and skips it off the own profile, so the
 * "am I looking at myself?" rule lives in one place rather than being
 * duplicated here. Takes `stats` whole rather than destructured fields —
 * Codacy counts destructured props as parameters and blocks above eight.
 */
const RatioPolicyNotice = ({
  stats
}: {
  stats: { ratio: number; requiredRatio: number; policy?: RatioPolicyView };
}) => {
  const policy = stats.policy;
  if (!policy) return null;

  if (policy.status === 'DOWNLOAD_DISABLED')
    return (
      <div role="status" className={DISABLED_CLASS}>
        <DisabledNotice cause={policy.disabledCause} />
      </div>
    );

  if (policy.status === 'WATCH')
    return (
      <div role="status" className={WATCH_CLASS}>
        <WatchNotice
          expiresAt={policy.watchExpiresAt}
          numbers={{ ratio: stats.ratio, requiredRatio: stats.requiredRatio }}
        />
      </div>
    );

  return null;
};

export default RatioPolicyNotice;
