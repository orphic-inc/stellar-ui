import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useGetAnnouncementsQuery } from '../../../store/services/miscApi';
import Time from '../../layout/Time';
import Spinner from '../../layout/Spinner';

const PrivateHomepage = () => {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading } = useGetAnnouncementsQuery();

  return (
    <div className="homepage">
      <div className="thin">
        <h2>Welcome back, {user?.username}.</h2>
      </div>
      <div className="homepage-grid">
        <div className="homepage-main">
          <div className="box">
            <div className="head colhead_dark">Announcements</div>
            {isLoading ? (
              <Spinner />
            ) : (
              <table className="layout">
                <tbody>
                  {data?.data?.announcements?.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <strong>{n.title}</strong>
                      </td>
                      <td className="time">
                        <Time date={n.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="box">
            <div className="head colhead_dark">Blog</div>
            {isLoading ? (
              <Spinner />
            ) : (
              <table className="layout">
                <tbody>
                  {data?.data?.blogPosts?.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.title}</strong>
                        <span className="username"> — {b.user?.username}</span>
                      </td>
                      <td className="time">
                        <Time date={b.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="homepage-sidebar">
          <div className="box">
            <div className="head colhead_dark">Quick Links</div>
            <ul className="sidebar-list">
              <li>
                <Link to="/private/forums">Forums</Link>
              </li>
              <li>
                <Link to="/private/communities">Communities</Link>
              </li>
              <li>
                <Link to="/private/contribute">Upload</Link>
              </li>
              <li>
                <Link to="/private/invite">Invite a friend</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateHomepage;
