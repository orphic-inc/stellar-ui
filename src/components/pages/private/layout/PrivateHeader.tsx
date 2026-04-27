import { Link, NavLink } from 'react-router-dom';
import UserMenu from '../../../layout/UserMenu';
import Alert from '../../../layout/Alert';
import ModBar from '../../../admin/ModBar';
import type { AuthUser } from '../../../../types';
import { isStaffUser } from '../../../../utils/permissions';
import { formatBytes } from '../../../../utils';
import {
  useGetUnreadCountQuery,
  useGetTicketUnreadCountQuery
} from '../../../../store/services/messagesApi';

interface Props {
  user: AuthUser;
}

const navLinks = [
  { label: 'Home', to: '/private/' },
  { label: 'Communities', to: '/private/communities' },
  { label: 'Collages', to: '/private/collages' },
  { label: 'Forums', to: '/private/forums' },
  { label: 'Upload', to: '/private/contribute' },
  { label: 'Requests', to: '/private/requests' },
  { label: 'Invites', to: '/private/invite' }
];

const PrivateHeader = ({ user }: Props) => {
  const isStaff = isStaffUser(user);
  const { data: inboxData } = useGetUnreadCountQuery();
  const { data: ticketData } = useGetTicketUnreadCountQuery();
  const inboxUnread = inboxData?.count ?? 0;
  const ticketUnread = ticketData?.count ?? 0;

  const uploaded = user.uploaded ? formatBytes(Number(user.uploaded)) : '0 B';
  const downloaded = user.downloaded
    ? formatBytes(Number(user.downloaded))
    : '0 B';
  const ratio = user.ratio != null ? user.ratio.toFixed(2) : '∞';

  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      {/* Brand + user bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <Link
          to="/private/"
          className="text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          Stellar
        </Link>
        <UserMenu user={user} />
      </div>

      {/* Stats + quicklinks bar */}
      <div className="bg-gray-900/60 border-t border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between gap-4 text-xs text-gray-500">
          {/* Data stats */}
          <div className="flex items-center gap-4">
            <span>
              Contributed:{' '}
              <span className="text-gray-300 font-medium">{uploaded}</span>
            </span>
            <span>
              Consumed:{' '}
              <span className="text-gray-300 font-medium">{downloaded}</span>
            </span>
            <span>
              Ratio: <span className="text-gray-300 font-medium">{ratio}</span>
            </span>
          </div>
          {/* Quicklinks */}
          <div className="flex items-center gap-3">
            <Link
              to="/private/messages"
              className="hover:text-gray-200 transition-colors"
            >
              Inbox
              {inboxUnread > 0 && (
                <span className="ml-1 bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {inboxUnread}
                </span>
              )}
            </Link>
            <Link
              to="/private/messages/tickets"
              className="hover:text-gray-200 transition-colors"
            >
              Tickets
              {ticketUnread > 0 && (
                <span className="ml-1 bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {ticketUnread}
                </span>
              )}
            </Link>
            <Link
              to="/private/contribute/list"
              className="hover:text-gray-200 transition-colors"
            >
              Contributions
            </Link>
            <Link
              to="/private/notifications"
              className="hover:text-gray-200 transition-colors"
            >
              Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-0.5">
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/private/'}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {isStaff && (
            <NavLink
              to="/private/staff/tools"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium transition-colors border-b-2 ml-auto ${
                  isActive
                    ? 'border-amber-500 text-amber-300'
                    : 'border-transparent text-amber-500/70 hover:text-amber-400 hover:border-amber-700'
                }`
              }
            >
              Staff
            </NavLink>
          )}
        </div>
      </nav>

      {isStaff && <ModBar />}
      <Alert />
    </header>
  );
};

export default PrivateHeader;
