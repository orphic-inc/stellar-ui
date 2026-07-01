import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useGetMeQuery } from '../../store/services/authApi';
import { canSeeTop10History } from '../staff/staffAffordances';

// Tab-strip: token utilities paint the active/idle state directly, no Role
// (the WS8 tab pattern, as Settings / the primary nav do it).
const tabCls = (active: boolean) =>
  `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    active
      ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
      : 'border-transparent text-[var(--st-text-muted)] hover:text-[var(--st-text)] hover:border-[var(--st-border-strong)]'
  }`;

const TABS = [
  { path: 'releases', label: 'Releases' },
  { path: 'users', label: 'Users' },
  { path: 'tags', label: 'Tags' },
  { path: 'votes', label: 'Votes' }
];

const Top10Layout = () => {
  const { pathname } = useLocation();
  const { data: user } = useGetMeQuery();
  const canViewHistory = canSeeTop10History(user);

  if (pathname === '/private/top10' || pathname === '/private/top10/') {
    return <Navigate to="releases" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 data-st="prose" data-st-strong className="text-2xl">
        Top 10
      </h1>

      <nav className="flex gap-1 border-b border-[var(--st-border)]">
        {TABS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => tabCls(isActive)}
          >
            {label}
          </NavLink>
        ))}
        {canViewHistory && (
          <NavLink to="history" className={({ isActive }) => tabCls(isActive)}>
            History
          </NavLink>
        )}
      </nav>

      <Outlet />
    </div>
  );
};

export default Top10Layout;
