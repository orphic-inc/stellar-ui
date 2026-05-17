import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission } from '../../utils/permissions';

const tabCls = (active: boolean) =>
  `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    active
      ? 'border-indigo-500 text-indigo-400'
      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
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
  const isStaff = hasAnyPermission(user, ['staff', 'admin']);

  if (pathname === '/private/top10' || pathname === '/private/top10/') {
    return <Navigate to="releases" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Top 10</h1>

      <nav className="flex gap-1 border-b border-gray-700">
        {TABS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => tabCls(isActive)}
          >
            {label}
          </NavLink>
        ))}
        {isStaff && (
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
