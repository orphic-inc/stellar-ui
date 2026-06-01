import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import UserMenu from '../../../layout/UserMenu';
import kuroLogo from '../../../../assets/kuro-logo.png';
import kuroLogoHover from '../../../../assets/kuro-logo-hover.png';
import darkAmbientLogo from '../../../../assets/dark-ambient-logo.png';
import layerCakeLogo from '../../../../assets/layer-cake-logo.png';
import layerCakeLogoHover from '../../../../assets/layer-cake-logo-hover.png';
import postmodLogo from '../../../../assets/postmod-logo.png';
import protonLogo from '../../../../assets/proton-logo.png';
import Alert from '../../../layout/Alert';
import ModBar from '../../../admin/ModBar';
import QuickSearch from '../../../layout/QuickSearch';
import type { AuthUser } from '../../../../types';
import {
  canAccessStaffQueue,
  canSeeModBar
} from '../../../staff/staffAffordances';
import { formatBytes } from '../../../../utils';
import { useGetUnreadCountQuery } from '../../../../store/services/messagesApi';
import {
  useGetQueueCountQuery,
  useGetMyTicketCountQuery
} from '../../../../store/services/staffInboxApi';
import { useGetMyProfileQuery } from '../../../../store/services/profileApi';

// Asset naming convention: src/assets/{theme}-logo.png, src/assets/{theme}-logo-hover.png
const THEME_LOGOS: Record<string, [string, string]> = {
  kuro: [kuroLogo, kuroLogoHover],
  'dark-ambient': [darkAmbientLogo, darkAmbientLogo],
  'layer-cake': [layerCakeLogo, layerCakeLogoHover],
  postmod: [postmodLogo, postmodLogo],
  proton: [protonLogo, protonLogo]
};
const DEFAULT_LOGO: [string, string] = [kuroLogo, kuroLogoHover];

interface Props {
  user: AuthUser;
}

const navLinks = [
  { label: 'Home', to: '/private/', end: true },
  { label: 'Communities', to: '/private/communities' },
  { label: 'Collages', to: '/private/collages' },
  { label: 'Requests', to: '/private/requests' },
  { label: 'Forums', to: '/private/forums' },
  { label: 'Top 10', to: '/private/top10' },
  { label: 'Wiki', to: '/private/wiki' },
  { label: 'Rules', to: '/private/rules' },
  { label: 'Staff', to: '/private/staff', end: true }
];

const PrivateHeader = ({ user }: Props) => {
  const [hovered, setHovered] = useState(false);
  const { data: profile } = useGetMyProfileQuery();
  const [logo, logoHovered] =
    THEME_LOGOS[profile?.userSettings?.siteAppearance ?? ''] ?? DEFAULT_LOGO;
  const showModBar = canSeeModBar(user);
  const showStaffQueue = canAccessStaffQueue(user);
  const { data: inboxData } = useGetUnreadCountQuery();
  const { data: ticketData } = useGetQueueCountQuery();
  const { data: myTicketData } = useGetMyTicketCountQuery();
  const inboxUnread = inboxData?.count ?? 0;
  const ticketUnread = ticketData?.count ?? 0;
  const myTicketUnread = myTicketData?.count ?? 0;

  const uploaded = user.contributed
    ? formatBytes(Number(user.contributed))
    : '0 B';
  const downloaded = user.consumed ? formatBytes(Number(user.consumed)) : '0 B';
  const ratio = user.ratio != null ? user.ratio.toFixed(2) : '∞';

  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      {/* Brand + user bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <Link
          to="/private/"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={hovered ? logoHovered : logo}
            alt="Stellar"
            className="h-8 w-auto"
          />
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
            <Link
              to="/private/ratio"
              className="hover:text-gray-300 transition-colors"
            >
              Ratio: <span className="text-gray-300 font-medium">{ratio}</span>
            </Link>
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
              Staff Inbox
              {myTicketUnread > 0 && (
                <span className="ml-1 bg-amber-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {myTicketUnread}
                </span>
              )}
            </Link>
            {showStaffQueue && (
              <Link
                to="/private/staff/tickets"
                className="hover:text-gray-200 transition-colors"
              >
                Staff Queue
                {ticketUnread > 0 && (
                  <span className="ml-1 bg-amber-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                    {ticketUnread}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/private/contribute/list"
              className="hover:text-gray-200 transition-colors"
            >
              Contributions
            </Link>
            <Link
              to="/private/bookmarks"
              className="hover:text-gray-200 transition-colors"
            >
              Bookmarks
            </Link>
            <Link
              to="/private/friends"
              className="hover:text-gray-200 transition-colors"
            >
              Friends
            </Link>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-0.5">
          {navLinks.map(({ label, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end ?? false}
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
        </div>
      </nav>

      <QuickSearch />
      {showModBar && <ModBar />}
      <Alert />
    </header>
  );
};

export default PrivateHeader;
