import { Link } from 'react-router-dom';
import { untilTime } from '../../utils';
import type { components } from '../../types/api';

type RatioPolicyState = components['schemas']['RatioPolicyState'];

// Why downloads are disabled decides what the member can do about it
// (stellar-api#646): a ratio disable lifts itself on the daily sweep, a staff
// disable does not. `null` is unreachable for a disabled row after the api's
// backfill, so that arm says nothing about the cause.
const DisabledNotice = ({
  cause
}: {
  cause: RatioPolicyState['disabledCause'];
}) => {
  if (cause === 'RATIO')
    return (
      <>
        <strong>Downloads disabled.</strong> Your ratio fell short of its
        requirement. They come back automatically once your ratio meets it,
        checked daily. See the{' '}
        <Link to="/ratio" className="underline">
          ratio rules
        </Link>
        .
      </>
    );
  const staffPm = (
    <Link to="/inbox/staff/new" className="underline">
      Staff PM
    </Link>
  );
  if (cause === 'STAFF')
    return (
      <>
        <strong>Downloads disabled by staff.</strong> This does not lift on its
        own. Contact staff through {staffPm} if you have questions.
      </>
    );
  return (
    <>
      <strong>Downloads disabled.</strong> Contact staff through {staffPm}.
    </>
  );
};

// The api owns the words: this mirrors the watch PM in stellar-api's
// `modules/ratioPolicy.ts` — the numbers, the deadline, and BOTH exit
// conditions. The 10 GiB trigger matters most, because it can fire tomorrow
// whatever the deadline says. No "you must upload X" figure: the required
// ratio is computed from eligible contribution bytes, so it moves as you
// upload and any deficit we printed here would overstate it.
const WatchNotice = ({
  ratio,
  requiredRatio,
  expiresAt
}: {
  ratio: number;
  requiredRatio: number;
  expiresAt: string | null;
}) => (
  <>
    <strong>Ratio watch.</strong> Your ratio is {ratio.toFixed(3)}; your
    required ratio is {requiredRatio.toFixed(3)}.{' '}
    {/* Guarded: the contract allows a null expiry, and `untilTime` renders a
        missing date as "shortly", which would read as an imminent deadline. */}
    {expiresAt !== null && <>Your watch ends {untilTime(expiresAt)}. </>}
    If your ratio is still short then, or you download 10 GiB or more before it
    is, your downloads will be disabled. See the{' '}
    <Link to="/ratio" className="underline">
      ratio rules
    </Link>
    .
  </>
);

/**
 * The member-facing ratio policy notice (stellar-api#646, ADR-0044).
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
  stats: { ratio: number; requiredRatio: number; policy?: RatioPolicyState };
}) => {
  const policy = stats.policy;
  if (!policy) return null;

  if (policy.status === 'DOWNLOAD_DISABLED')
    return (
      <div
        role="status"
        className="border border-[color-mix(in_oklch,var(--st-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-danger)_12%,transparent)] px-4 py-3 text-sm text-[var(--st-danger)]"
      >
        <DisabledNotice cause={policy.disabledCause} />
      </div>
    );

  if (policy.status === 'WATCH')
    return (
      <div
        role="status"
        className="border border-[color-mix(in_oklch,var(--st-warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-warning)_12%,transparent)] px-4 py-3 text-sm text-[var(--st-warning)]"
      >
        <WatchNotice
          ratio={stats.ratio}
          requiredRatio={stats.requiredRatio}
          expiresAt={policy.watchExpiresAt}
        />
      </div>
    );

  return null;
};

export default RatioPolicyNotice;
