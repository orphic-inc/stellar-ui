import { useSearchParams, Link } from 'react-router-dom';
import { useSearchUsersQuery } from '../../store/services/searchApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';

const inputCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1';
const UserBrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: user } = useGetMeQuery();
  const isPrivileged = hasAnyPermission(user, [
    'users_search',
    'staff',
    'admin'
  ]);

  const q = searchParams.get('q') ?? undefined;
  const orderBy = (searchParams.get('orderBy') ?? 'username') as
    | 'username'
    | 'createdAt'
    | 'lastLogin';
  const order = (searchParams.get('order') ?? 'asc') as 'asc' | 'desc';
  const rawDisabled = searchParams.get('disabled');
  const disabled =
    rawDisabled === 'true' ? true : rawDisabled === 'false' ? false : undefined;
  const page = Number(searchParams.get('page') ?? 1);

  const { data, isLoading, error } = useSearchUsersQuery({
    q,
    orderBy,
    order,
    disabled: isPrivileged ? disabled : undefined,
    page
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const qv = fd.get('q');
    if (qv && String(qv).trim()) next.set('q', String(qv).trim());
    const ob = fd.get('orderBy');
    if (ob && ob !== 'username') next.set('orderBy', String(ob));
    const od = fd.get('order');
    if (od && od !== 'asc') next.set('order', String(od));
    if (isPrivileged) {
      const dv = fd.get('disabled');
      if (dv === 'true' || dv === 'false') next.set('disabled', dv);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-48">
            <label htmlFor="user-q" className={labelCls}>
              Username{isPrivileged ? ' or email' : ''}
            </label>
            <input
              id="user-q"
              name="q"
              defaultValue={q}
              className={inputCls}
              placeholder="Search users…"
            />
          </div>
          {isPrivileged && (
            <>
              <div>
                <label htmlFor="user-orderBy" className={labelCls}>
                  Order by
                </label>
                <select
                  id="user-orderBy"
                  name="orderBy"
                  defaultValue={orderBy}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="username">Username</option>
                  <option value="createdAt">Joined</option>
                  <option value="lastLogin">Last login</option>
                </select>
              </div>
              <div>
                <label htmlFor="user-order" className={labelCls}>
                  Direction
                </label>
                <select
                  id="user-order"
                  name="order"
                  defaultValue={order}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
              <div>
                <label htmlFor="user-disabled" className={labelCls}>
                  Status
                </label>
                <select
                  id="user-disabled"
                  name="disabled"
                  defaultValue={disabled != null ? String(disabled) : ''}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All</option>
                  <option value="false">Active</option>
                  <option value="true">Disabled</option>
                </select>
              </div>
            </>
          )}
          <button
            type="submit"
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams())}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors"
          >
            Reset
          </button>
        </form>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load results.</p>}
      {data && (
        <>
          <p className="text-xs text-gray-500">
            {data.meta.total} user{data.meta.total !== 1 ? 's' : ''}
          </p>
          {data.data.length === 0 ? (
            <p className="text-gray-400 text-sm">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-2 font-medium">Username</th>
                    <th className="pb-2 font-medium">Rank</th>
                    <th className="pb-2 font-medium">Joined</th>
                    {isPrivileged && (
                      <>
                        <th className="pb-2 font-medium">Last login</th>
                        <th className="pb-2 font-medium">Ratio</th>
                        <th className="pb-2 font-medium">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-800/50 hover:bg-gray-900/30"
                    >
                      <td className="py-2 pr-4">
                        <Link
                          to={`/private/user/${u.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          {u.username}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          style={{ color: u.userRank.color ?? undefined }}
                          className="text-sm"
                        >
                          {u.userRank.name}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      {isPrivileged && (
                        <>
                          <td className="py-2 pr-4 text-gray-400 text-xs">
                            {u.lastLogin
                              ? new Date(u.lastLogin).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="py-2 pr-4 text-gray-400 text-xs">
                            {u.ratio != null ? Number(u.ratio).toFixed(2) : '∞'}
                          </td>
                          <td className="py-2 text-xs">
                            {u.disabled ? (
                              <span className="text-red-400">Disabled</span>
                            ) : (
                              <span className="text-green-400">Active</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.meta.totalPages > 1 && (
            <div className="flex gap-1 flex-wrap">
              {Array.from(
                { length: data.meta.totalPages },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 text-xs rounded ${
                    p === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserBrowsePage;
