import {
  DisabledNotice,
  WatchNotice,
  DISABLED_CLASS,
  WATCH_CLASS
} from './ratioPolicyCopy';
import type { AuthUser } from '../../types';

/**
 * Exactly the session fields this reads, taken from the contract rather than
 * restated — so a change to either on the api side surfaces here as a type
 * error instead of a silently dead branch.
 *
 * Hoisted out of the props annotation deliberately: Codacy's lizard counts each
 * optional property in an INLINE structural type toward cyclomatic complexity,
 * which put this component at 11 against a limit of 10 while the code itself
 * branched four times.
 */
type BannerUser = Pick<AuthUser, 'canDownload' | 'ratioPolicy'>;

/**
 * The site-wide ratio policy banner (#345), on every authenticated page.
 *
 * The profile notice (#334) and the transition PM both require the member to
 * go looking. A ratio watch runs 14 days and carries a 10 GiB download trigger,
 * either of which can pass unseen. This is the surface that cannot be missed.
 *
 * Not dismissible, by decision: a notification is an event you acknowledge
 * once, this is derived state that is true until it is not. Dismissing it would
 * be dismissing a fact — and a member who dismissed it on Monday would get no
 * warning on Thursday as the 10 GiB trigger approached.
 *
 * Presentational: `PrivateLayout` owns the polled session subscription.
 */
const RatioPolicyBanner = ({ user }: { user: BannerUser }) => {
  const policy = user.ratioPolicy ?? null;

  // Keyed on `canDownload`, NOT on `policy.status`. The api documents the flag
  // as "an independent download-capability flag, NOT a projection of ratio",
  // with ratio policy merely its first writer and future abuse suspensions
  // expected to gate it too. Keying on the policy enum would leave any such
  // member with dead download buttons and no explanation anywhere — which is
  // the exact defect #334 existed to fix. The cause only EXPLAINS the flag, and
  // degrades to the neutral arm when the ratio domain has nothing to say.
  if (user.canDownload === false)
    return (
      <div role="status" className={DISABLED_CLASS}>
        <DisabledNotice cause={policy?.disabledCause ?? null} />
      </div>
    );

  // A watch has no flag of its own, so this arm reads the policy. Reached only
  // when the member can still download, so a disable always wins — it is the
  // stronger state and the one being experienced.
  if (policy?.status === 'WATCH')
    return (
      <div role="status" className={WATCH_CLASS}>
        {/* No numbers: a banner is an interrupt, not a report. The profile
            notice and /ratio carry the arithmetic. */}
        <WatchNotice expiresAt={policy.watchExpiresAt} />
      </div>
    );

  return null;
};

export default RatioPolicyBanner;
