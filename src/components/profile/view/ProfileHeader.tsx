import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  useAcceptFriendRequestMutation,
  useAddFriendMutation,
  useGetFriendStatusQuery,
  useRemoveFriendMutation
} from '../../../store/services/friendApi';
import { addAlert } from '../../../store/slices/alertSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { getApiErrorMessage } from '../../../utils/apiError';
import UserBadges from '../../layout/UserBadges';
import type { ProfileView } from './profileView';

type FriendTrigger = (id: number) => { unwrap: () => Promise<unknown> };

/** Run one friend action, alerting its success or the api's refusal. */
const useFriendAction = (
  trigger: FriendTrigger,
  success: string,
  failure: string
) => {
  const dispatch = useDispatch();
  return async (id: number) => {
    try {
      await trigger(id).unwrap();
      dispatch(addAlert(success, 'success'));
    } catch (err) {
      dispatch(addAlert(getApiErrorMessage(err) ?? failure, 'danger'));
    }
  };
};

/** Remove, accept and add, each alerting in the member's name. */
const useFriendActions = (name: string) => {
  const [addFriend] = useAddFriendMutation();
  const [acceptRequest] = useAcceptFriendRequestMutation();
  const [removeFriend] = useRemoveFriendMutation();
  return {
    remove: useFriendAction(
      removeFriend,
      `${name} removed from friends.`,
      'Failed to remove friend.'
    ),
    accept: useFriendAction(
      acceptRequest,
      `You and ${name} are now friends.`,
      'Failed to accept request.'
    ),
    add: useFriendAction(
      addFriend,
      `Friend request sent to ${name}.`,
      'Failed to add friend.'
    )
  };
};

const FriendActions = ({ profile }: { profile: ProfileView }) => {
  const currentUser = useSelector(selectCurrentUser);
  const { data: friendStatus } = useGetFriendStatusQuery(profile.id, {
    skip: !currentUser
  });
  const { remove, accept, add } = useFriendActions(profile.username);

  switch (friendStatus?.status) {
    case 'accepted':
      return (
        <button onClick={() => remove(profile.id)} data-st="control">
          Remove Friend
        </button>
      );
    case 'pending_received':
      return (
        <button
          onClick={() => accept(profile.id)}
          data-st="control"
          data-st-success
        >
          Accept Friend Request
        </button>
      );
    case 'pending_sent':
      return <span data-st="meta">Friend Request Sent</span>;
    default:
      return (
        <button onClick={() => add(profile.id)} data-st="control">
          Add to Friends
        </button>
      );
  }
};

/** Message, friend and report actions on another member's profile. */
const MemberActions = ({ profile }: { profile: ProfileView }) => (
  <>
    <Link to={`/messages/new?to=${profile.username}`} data-st="control">
      Send Message
    </Link>
    <FriendActions profile={profile} />
    <Link
      to={`/reports/new?targetType=User&targetId=${profile.id}`}
      data-st="control"
    >
      Report
    </Link>
  </>
);

const ProfileLinks = ({
  profile,
  isOwnProfile,
  isStaff
}: {
  profile: ProfileView;
  isOwnProfile: boolean;
  isStaff: boolean;
}) => (
  <div className="flex items-center gap-3 ml-auto text-sm">
    {isOwnProfile && (
      <Link to={`/user/edit/${profile.id}`} data-st="control">
        Settings
      </Link>
    )}
    {(isOwnProfile || isStaff) && (
      <Link to={`/user/${profile.id}/stats`} data-st="control">
        Stats
      </Link>
    )}
    {!isOwnProfile && <MemberActions profile={profile} />}
  </div>
);

const ProfileHeader = ({
  profile,
  isOwnProfile,
  isStaff
}: {
  profile: ProfileView;
  isOwnProfile: boolean;
  isStaff: boolean;
}) => (
  <div className="mb-6 flex items-center gap-3 flex-wrap">
    <h1 data-st="prose" data-st-strong className="text-2xl">
      {profile.username}
    </h1>
    {profile.profile?.profileTitle && (
      <span data-st="meta" className="text-sm">
        {profile.profile.profileTitle}
      </span>
    )}
    <UserBadges
      userId={profile.id}
      disabled={profile.disabled}
      warned={profile.warned}
      donorRank={profile.donorPresentation?.rank ?? null}
    />
    <ProfileLinks
      profile={profile}
      isOwnProfile={isOwnProfile}
      isStaff={isStaff}
    />
  </div>
);

export default ProfileHeader;
