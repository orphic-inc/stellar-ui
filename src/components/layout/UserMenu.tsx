import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLogoutMutation } from '../../store/services/authApi';
import { api } from '../../store/api';
import { logout as logoutAction } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { hasPermission } from '../../utils/permissions';
import type { AuthUser } from '../../types';

interface Props {
  user: AuthUser;
}

const UserMenu = ({ user }: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();

  // Signs out here only once the server has ended the session. Until then
  // the session cookie still works, so clearing the ui would only claim a
  // sign-out a reload undoes (#462).
  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(logoutAction());
      dispatch(api.util.resetApiState());
      navigate('/login');
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? "Couldn't sign out; try again.",
          'danger'
        )
      );
    }
  };

  // `invites_unlimited` (stellar-api#637) is what makes a balance meaningless;
  // `inviteCount` is a non-null column, so the old null check never fired.
  const inviteDisplay = hasPermission(user, 'invites_unlimited')
    ? '∞'
    : String(user.inviteCount ?? 0);

  return (
    <div className="flex items-center gap-1 text-sm">
      <Link
        to={`/user/${user.username}`}
        className="px-3 py-1.5 rounded text-[var(--st-link)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors font-medium"
      >
        {user.username}
      </Link>
      <Link
        to={`/user/edit/${user.id}`}
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
        to="/contribute"
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Contribute
      </Link>
      <Link
        to="/invite"
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Invite ({inviteDisplay})
      </Link>
      <Link
        to="/donate"
        className="px-3 py-1.5 rounded text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)] transition-colors"
      >
        Donate
      </Link>
    </div>
  );
};

export default UserMenu;
