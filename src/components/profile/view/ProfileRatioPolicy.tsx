import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { untilTime } from '../../../utils';
import RatioPolicyNotice from '../RatioPolicyNotice';
import {
  DISABLED_CLASS,
  WATCH_CLASS,
  type RatioPolicyView
} from '../../ratio/ratioPolicyCopy';
import {
  formatByteStat,
  type MyRatioStats,
  type ProfileView
} from './profileView';

type RatioWatch = NonNullable<ProfileView['ratioWatch']>;

/** The staff tool, already on this member (ui#417). */
const ToolLink = ({ userId }: { userId: number }) => (
  <Link to={`/staff/tools/ratio-policy?user=${userId}`} className="underline">
    Manage in ratio policy tool
  </Link>
);

/**
 * Another member's active watch, in the third person (stellar-api#658). The
 * deficit is stated as a present fact, never "must contribute X": see the
 * note on `WatchNotice` in `ratioPolicyCopy`.
 */
const PeerWatch = ({ watch }: { watch: RatioWatch }) => (
  <>
    <strong>Ratio watch.</strong> This member&apos;s watch ends{' '}
    {untilTime(watch.expiresAt)}. They are currently{' '}
    {formatByteStat(watch.deficit)} short of their required ratio, and have
    consumed {formatByteStat(watch.consumedSinceWatch)} since it began.{' '}
  </>
);

const DISABLED_CAUSE: Record<string, string> = {
  STAFF: ' by staff',
  RATIO: ' for ratio'
};

/**
 * The `ratio_policy_manage` view: the api sends `ratioPolicy` to nobody else.
 * A `WATCH` with no `ratioWatch` has expired, or recovered, ahead of the sweep.
 */
const StaffBox = ({
  policy,
  watch,
  userId
}: {
  policy: Pick<RatioPolicyView, 'status' | 'disabledCause'>;
  watch: RatioWatch | null;
  userId: number;
}) => {
  if (policy.status === 'DOWNLOAD_DISABLED')
    return (
      <div role="status" className={DISABLED_CLASS}>
        <strong>
          Downloads disabled
          {DISABLED_CAUSE[policy.disabledCause ?? ''] ?? ''}.
        </strong>{' '}
        <ToolLink userId={userId} />
      </div>
    );
  if (policy.status === 'WATCH')
    return (
      <div role="status" className={WATCH_CLASS}>
        {watch ? (
          <PeerWatch watch={watch} />
        ) : (
          <>
            <strong>On ratio watch.</strong> The daily sweep will settle
            it.{' '}
          </>
        )}
        <ToolLink userId={userId} />
      </div>
    );
  return null;
};

/**
 * The ratio policy at the top of a profile's main column (ui#334, ui#417).
 *
 * - The own profile keeps the member's own notice, and nothing else.
 * - Another member's profile shows an active watch to every viewer: privacy
 *   is a privilege (stellar-api ADR-0052).
 * - A viewer holding `ratio_policy_manage` sees the status instead.
 */
const ProfileRatioPolicy = ({
  profile,
  ownStats
}: {
  profile: ProfileView;
  ownStats?: MyRatioStats;
}) => {
  const currentUser = useSelector(selectCurrentUser);
  if (currentUser?.id === profile.id)
    return ownStats ? <RatioPolicyNotice stats={ownStats} /> : null;

  if (profile.ratioPolicy)
    return (
      <StaffBox
        policy={profile.ratioPolicy}
        watch={profile.ratioWatch}
        userId={profile.id}
      />
    );
  if (profile.ratioWatch)
    return (
      <div role="status" className={WATCH_CLASS}>
        <PeerWatch watch={profile.ratioWatch} />
      </div>
    );
  return null;
};

export default ProfileRatioPolicy;
