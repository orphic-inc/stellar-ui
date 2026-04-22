import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLogoutMutation } from '../../store/services/authApi';
import { logout as logoutAction } from '../../store/slices/authSlice';
import type { AuthUser } from '../../types';

interface Props {
  user: AuthUser;
}

const isStaffLevel = (user: AuthUser) => (user.userRank?.level ?? 0) >= 500;

const UserMenu = ({ user }: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    dispatch(logoutAction());
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <Link
        to={`/private/user/${user.id}`}
        className="px-3 py-1.5 rounded text-indigo-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
      >
        {user.username}
      </Link>
      <Link
        to={`/private/user/edit/${user.id}`}
        className="px-3 py-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        Settings
      </Link>
      <Link
        to="/private/invite"
        className="px-3 py-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        Invites ({user.inviteCount ?? 0})
      </Link>
      {isStaffLevel(user) && (
        <Link
          to="/private/staff/tools"
          className="px-3 py-1.5 rounded text-amber-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
        >
          Toolbox
        </Link>
      )}
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default UserMenu;
