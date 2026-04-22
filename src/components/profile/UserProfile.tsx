import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetProfileByUserIdQuery } from '../../store/services/profileApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector(selectCurrentUser);
  const { data: profile, isLoading, error } = useGetProfileByUserIdQuery(id!);

  if (isLoading) return <Spinner />;
  if (error || !profile) return <div className="error">User not found.</div>;

  const isOwnProfile = currentUser?.id === profile.userId;

  return (
    <div className="thin">
      <div className="header">
        <h2>
          <strong>
            <Link to={`/private/user/${profile.userId}`}>
              {profile.username}
            </Link>
          </strong>
        </h2>
      </div>
      <div className="linkbox">
        {isOwnProfile && (
          <Link
            to={`/private/user/edit/${profile.userId}`}
            className="brackets"
          >
            Settings
          </Link>
        )}
      </div>

      <div className="sidebar">
        <div className="box box_image box_image_avatar">
          <div className="head colhead_dark">Avatar</div>
          <div className="center">
            <div className="avatar_container">
              <img
                width={150}
                alt={`${profile.username}'s avatar`}
                className="avatar_0"
                src={profile.avatar ?? '/static/common/avatars/default.png'}
              />
            </div>
          </div>
        </div>

        <div className="box box_info">
          <div className="head colhead_dark">Stats</div>
          <ul className="stats nobullet">
            {profile.joinedAt && (
              <li>
                Joined:{' '}
                <span>
                  <Time date={profile.joinedAt} />
                </span>
              </li>
            )}
            {profile.lastSeen && (
              <li>
                Last seen:{' '}
                <span>
                  <Time date={profile.lastSeen} />
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {profile.info && (
        <div className="main_column">
          <div className="box">
            <div className="head colhead_dark">Profile</div>
            <div
              className="pad"
              dangerouslySetInnerHTML={{ __html: profile.info }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
