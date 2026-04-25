import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DOMPurify from 'dompurify';
import { useGetProfileByUserIdQuery } from '../../store/services/profileApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import RatioStats from './RatioStats';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector(selectCurrentUser);
  const { data: profile, isLoading, error } = useGetProfileByUserIdQuery(id!);

  if (isLoading) return <Spinner />;
  if (error || !profile) return <div className="error">User not found.</div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="thin">
      <div className="header">
        <h2>
          <strong>
            <Link to={`/private/user/${profile.id}`}>{profile.username}</Link>
          </strong>
        </h2>
      </div>
      <div className="linkbox">
        {isOwnProfile && (
          <Link to={`/private/user/edit/${profile.id}`} className="brackets">
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
                src={
                  profile.profile?.avatar ??
                  profile.avatar ??
                  '/static/common/avatars/default.png'
                }
              />
            </div>
          </div>
        </div>

        <div className="box box_info">
          <div className="head colhead_dark">Stats</div>
          <ul className="stats nobullet">
            {profile.dateRegistered && (
              <li>
                Joined:{' '}
                <span>
                  <Time date={profile.dateRegistered} />
                </span>
              </li>
            )}
            {profile.userRank && (
              <li>
                Class:{' '}
                <span style={{ color: profile.userRank.color }}>
                  {profile.userRank.name}
                </span>
              </li>
            )}
          </ul>
        </div>

        {isOwnProfile && <RatioStats />}
      </div>

      {profile.profile?.profileInfo && (
        <div className="main_column">
          <div className="box">
            <div className="head colhead_dark">Profile</div>
            <div
              className="pad"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(profile.profile.profileInfo)
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
