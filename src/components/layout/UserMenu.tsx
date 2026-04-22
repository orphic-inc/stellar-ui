import { Link, useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../../store/services/authApi';
import type { AuthUser } from '../../types';

interface Props {
  user: AuthUser;
}

const UserMenu = ({ user }: Props) => {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav id="userinfo">
      <ul>
        <li>
          <Link to={`/private/user/${user.id}`}>{user.username}</Link>
        </li>
        <li>
          <Link to={`/private/user/edit/${user.id}`}>Settings</Link>
        </li>
        <li>
          <Link to="/private/invite">Invites ({user.inviteCount ?? 0})</Link>
        </li>
        <li>
          <Link to="/private/forums">Forums</Link>
        </li>
        <li>
          <Link to="/private/communities">Communities</Link>
        </li>
        {user.userRank?.permissions?.['admin_access'] && (
          <li>
            <Link to="/private/staff/tools">Toolbox</Link>
          </li>
        )}
        <li>
          <button className="btn-link" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default UserMenu;
