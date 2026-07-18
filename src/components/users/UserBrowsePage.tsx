import { useSearchParams, Link } from 'react-router-dom';
import { useSearchUsersQuery } from '../../store/services/searchApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';

// Layout-only class strings; paint comes from the `field`/`meta` Roles below.
// See ReleaseBrowsePage / global.css §2a.
const inputCls = 'w-full';
const labelCls = 'block text-xs font-medium mb-1';
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
      <h1 data-st="prose" data-st-strong className="text-2xl">
        Users
      </h1>

      <div data-st="panel" className="p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-48">
            <label htmlFor="user-q" data-st="meta" className={labelCls}>
              Username{isPrivileged ? ' or email' : ''}
            </label>
            <input
              id="user-q"
              name="q"
              defaultValue={q}
              data-st="field"
              className={inputCls}
              placeholder="Search users…"
            />
          </div>
          {isPrivileged && (
            <>
              <div>
                <label
                  htmlFor="user-orderBy"
                  data-st="meta"
                  className={labelCls}
                >
                  Order by
                </label>
                <select
                  id="user-orderBy"
                  name="orderBy"
                  defaultValue={orderBy}
                  data-st="field"
                >
                  <option value="username">Username</option>
                  <option value="createdAt">Joined</option>
                  <option value="lastLogin">Last login</option>
                </select>
              </div>
              <div>
                <label htmlFor="user-order" data-st="meta" className={labelCls}>
                  Direction
                </label>
                <select
                  id="user-order"
                  name="order"
                  defaultValue={order}
                  data-st="field"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="user-disabled"
                  data-st="meta"
                  className={labelCls}
                >
                  Status
                </label>
                <select
                  id="user-disabled"
                  name="disabled"
                  defaultValue={disabled != null ? String(disabled) : ''}
                  data-st="field"
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
            data-st="control"
            data-st-primary
            className="text-sm"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams())}
            data-st="control"
            className="text-sm"
          >
            Reset
          </button>
        </form>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load results.</p>}
      {data && (
        <>
          <p data-st="prose" data-st-muted className="text-xs">
            {data.meta.total} user{data.meta.total !== 1 ? 's' : ''}
          </p>
          {data.data.length === 0 ? (
            <p data-st="prose" data-st-muted className="text-sm">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              {/* Columnar data keeps its <table>; the grid/colhead/row variant
                  (ADR-0006) carries the token paint. */}
              <table data-st="grid" className="text-sm">
                <thead data-st="colhead">
                  <tr>
                    <th>Username</th>
                    <th>Rank</th>
                    <th>Joined</th>
                    {isPrivileged && (
                      <>
                        <th>Last login</th>
                        <th data-st-num>Ratio</th>
                        <th>Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr key={u.id} data-st="row">
                      <td>
                        <Link to={`/user/${u.id}`} data-st="title">
                          {u.username}
                        </Link>
                      </td>
                      <td>
                        {/* Rank colour is data-driven (per-rank), not a theme
                            token — keep the inline style. */}
                        <span
                          style={{ color: u.userRank.color ?? undefined }}
                          className="text-sm"
                        >
                          {u.userRank.name}
                        </span>
                      </td>
                      <td>
                        <span data-st="meta" className="text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      {isPrivileged && (
                        <>
                          <td>
                            <span data-st="meta" className="text-xs">
                              {u.lastLogin
                                ? new Date(u.lastLogin).toLocaleDateString()
                                : '—'}
                            </span>
                          </td>
                          <td data-st-num className="text-xs">
                            {u.ratio != null ? Number(u.ratio).toFixed(2) : '∞'}
                          </td>
                          <td className="text-xs">
                            {u.disabled ? (
                              <span className="text-[var(--st-danger)]">
                                Disabled
                              </span>
                            ) : (
                              <span className="text-[var(--st-success)]">
                                Active
                              </span>
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
                  data-st="control"
                  data-st-primary={p === page ? '' : undefined}
                  className="px-2.5 py-1 text-xs"
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
