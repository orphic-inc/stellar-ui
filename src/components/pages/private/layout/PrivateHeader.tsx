import { Link, NavLink } from 'react-router-dom';
import UserMenu from '../../../layout/UserMenu';
import Alert from '../../../layout/Alert';
import ModBar from '../../../admin/ModBar';
import type { AuthUser } from '../../../../types';

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
  const isStaff = (user.userRank?.level ?? 0) >= 500;

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
