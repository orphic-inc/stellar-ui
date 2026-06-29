import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLogoutMutation } from '../../store/services/authApi';
import { api } from '../../store/api';
import { logout as logoutAction } from '../../store/slices/authSlice';
import type { AuthUser } from '../../types';

interface Props {
  user: AuthUser;
}

const UserMenu = ({ user }: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    dispatch(logoutAction());
    dispatch(api.util.resetApiState());
    navigate('/login');
  };

  const inviteDisplay =
    user.inviteCount == null ? '∞' : String(user.inviteCount);

  return (
    <div className="flex items-center gap-1 text-sm">
      <Link
        to={`/private/user/${user.username}`}
        className="px-3 py-1.5 rounded text-[var(--st-link)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors font-medium"
      >
        {user.username}
      </Link>
      <Link
        to={`/private/user/edit/${user.id}`}
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Edit
      </Link>
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-danger)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Logout
      </button>
      <Link
        to="/private/contribute"
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Contribute
      </Link>
      <Link
        to="/private/invite"
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Invite ({inviteDisplay})
      </Link>
      <Link
        to="/private/donate"
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Donate
      </Link>
    </div>
  );
};

export default UserMenu;
