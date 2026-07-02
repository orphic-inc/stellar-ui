import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import UserMenu from '../../../layout/UserMenu';
import kuroLogo from '../../../../assets/logos/kuro-logo.png';
import kuroLogoHover from '../../../../assets/logos/kuro-logo-hover.png';
import darkAmbientLogo from '../../../../assets/logos/dark-ambient-logo.png';
import layerCakeLogo from '../../../../assets/logos/layer-cake-logo.png';
import layerCakeLogoHover from '../../../../assets/logos/layer-cake-logo-hover.png';
import postmodLogo from '../../../../assets/logos/postmod-logo.png';
import protonLogo from '../../../../assets/logos/proton-logo.png';
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

// Asset naming convention: src/assets/logos/{stylesheet}-logo.png (+ -hover.png)
const THEME_LOGOS: Record<string, [string, string]> = {
  kuro: [kuroLogo, kuroLogoHover],
  'dark-ambient': [darkAmbientLogo, darkAmbientLogo],
  'layer-cake': [layerCakeLogo, layerCakeLogoHover],
  postmod: [postmodLogo, postmodLogo],
  // anorex reuses postmod's wood logo until dedicated art lands (both are wood themes).
  anorex: [postmodLogo, postmodLogo],
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
    <header className="bg-[var(--st-backdrop)] border-b border-[var(--st-border-subtle)] sticky top-0 z-50">
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
      <div className="bg-[var(--st-base)] border-t border-[var(--st-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between gap-4 text-xs text-[var(--st-text-faint)]">
          {/* Data stats */}
          <div className="flex items-center gap-4">
            <span>
              Contributed:{' '}
              <span className="text-[var(--st-text)] font-medium">
                {uploaded}
              </span>
            </span>
            <span>
              Consumed:{' '}
              <span className="text-[var(--st-text)] font-medium">
                {downloaded}
              </span>
            </span>
            <Link
              to="/private/ratio"
              className="hover:text-[var(--st-text)] transition-colors"
            >
              Ratio:{' '}
              <span className="text-[var(--st-text)] font-medium">{ratio}</span>
            </Link>
          </div>
          {/* Quicklinks */}
          <div className="flex items-center gap-3">
            <Link
              to="/private/messages"
              className="hover:text-[var(--st-text)] transition-colors"
            >
              Inbox
              {inboxUnread > 0 && (
                <span className="ml-1 bg-[var(--st-accent)] text-[var(--st-text-strong)] rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {inboxUnread}
                </span>
              )}
            </Link>
            <Link
              to="/private/messages/tickets"
              className="hover:text-[var(--st-text)] transition-colors"
            >
              Staff Inbox
              {myTicketUnread > 0 && (
                <span className="ml-1 bg-[var(--st-warning)] text-[var(--st-text-strong)] rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {myTicketUnread}
                </span>
              )}
            </Link>
            {showStaffQueue && (
              <Link
                to="/private/staff/tickets"
                className="hover:text-[var(--st-text)] transition-colors"
              >
                Staff Queue
                {ticketUnread > 0 && (
                  <span className="ml-1 bg-[var(--st-warning)] text-[var(--st-text-strong)] rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                    {ticketUnread}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/private/contribute/list"
              className="hover:text-[var(--st-text)] transition-colors"
            >
              Contributions
            </Link>
            <Link
              to="/private/bookmarks"
              className="hover:text-[var(--st-text)] transition-colors"
            >
              Bookmarks
            </Link>
            <Link
              to="/private/friends"
              className="hover:text-[var(--st-text)] transition-colors"
            >
              Friends
            </Link>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="bg-[var(--st-base)] border-t border-[var(--st-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 flex gap-0.5">
          {navLinks.map(({ label, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end ?? false}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
                    : 'border-transparent text-[var(--st-text-muted)] hover:text-[var(--st-text)] hover:border-[var(--st-border-strong)]'
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
