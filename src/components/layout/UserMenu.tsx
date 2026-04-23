import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLogoutMutation } from '../../store/services/authApi';
import {
  useGetNotificationsQuery,
  useDeleteNotificationMutation
} from '../../store/services/notificationApi';
import { api } from '../../store/api';
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
  const { data: notifications } = useGetNotificationsQuery();
  const [deleteNotification] = useDeleteNotificationMutation();

  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    dispatch(logoutAction());
    dispatch(api.util.resetApiState());
    navigate('/login');
  };

  const count = notifications?.length ?? 0;

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

      {/* Notification bell */}
      <div ref={bellRef} className="relative">
        <button
          onClick={() => setShowNotifs((s) => !s)}
          className="relative px-3 py-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          🔔
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 bg-gray-700/60 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider text-gray-300">
              Notifications
            </div>
            {count === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500 text-center">
                No notifications
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto divide-y divide-gray-700/50">
                {notifications!.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start gap-2 px-3 py-2 hover:bg-gray-700/40 transition-colors"
                  >
                    <span className="flex-1 text-sm text-gray-200 leading-snug">
                      {n.quoter.username} quoted you on {n.page} #{n.pageId}
                    </span>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-xs shrink-0 mt-0.5"
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

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
