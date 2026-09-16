import { Link } from 'react-router-dom';
import { untilTime } from '../../utils';

/**
 * The words two surfaces share: the profile notice (#334) and the site-wide
 * banner (#345). They differ only in chrome and in whether the watch arm leads
 * with the numbers — everything else must be word-identical, or one member
 * reads two explanations of one state on two screens.
 *
 * The api owns the wording. Both arms mirror the transition PMs in
 * stellar-api's `modules/ratioPolicy.ts`; change them there first.
 */

/**
 * The narrow view both data sources satisfy: `RatioPolicyState` from
 * `GET /profile/me/ratio`, and `AuthUser.ratioPolicy` from the session (#659),
 * which is the same three fields. Structural typing means either is assignable
 * without the components knowing which one they got.
 */
export type RatioPolicyView = {
  status: 'OK' | 'WATCH' | 'DOWNLOAD_DISABLED';
  watchExpiresAt: string | null;
  disabledCause: 'RATIO' | 'STAFF' | null;
};

// Why downloads are disabled decides what the member can do about it
// (stellar-api#646): a ratio disable lifts itself on the daily sweep, a staff
// disable does not. The `null` arm is not dead defence on the banner — that
// surface keys on `canDownload`, so it renders for any disable the ratio
// domain does not own and has nothing specific to say about.
export const DisabledNotice = ({
  cause
}: {
  cause: RatioPolicyView['disabledCause'];
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

/**
 * The watch arm. `numbers` is optional because a banner is an interrupt, not a
 * report: the profile leads with the ratio and its requirement, the site-wide
 * banner states the consequence and links to the detail.
 *
 * No "you must upload X" figure on either. The required ratio is computed from
 * eligible contribution bytes, so it falls as you upload, and any deficit
 * printed here would overstate what a member owes.
 */
export const WatchNotice = ({
  expiresAt,
  numbers
}: {
  expiresAt: string | null;
  numbers?: { ratio: number; requiredRatio: number };
}) => (
  <>
    <strong>Ratio watch.</strong>{' '}
    {numbers && (
      <>
        Your ratio is {numbers.ratio.toFixed(3)}; your required ratio is{' '}
        {numbers.requiredRatio.toFixed(3)}.{' '}
      </>
    )}
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
 * Shared chrome, so the two surfaces cannot drift in severity colour.
 *
 * Written out in full rather than built from a `tone` argument: Tailwind
 * extracts complete class strings from source, so an interpolated arbitrary
 * value like `var(--st-${tone})` generates no CSS at all and fails silently.
 */
export const DISABLED_CLASS =
  'border border-[color-mix(in_oklch,var(--st-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-danger)_12%,transparent)] px-4 py-3 text-sm text-[var(--st-danger)]';

export const WATCH_CLASS =
  'border border-[color-mix(in_oklch,var(--st-warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-warning)_12%,transparent)] px-4 py-3 text-sm text-[var(--st-warning)]';
