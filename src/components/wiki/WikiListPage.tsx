import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useGetWikiPagesQuery } from '../../store/services/wikiApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';

const WikiListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const { data: user } = useGetMeQuery();

  const q = searchParams.get('q') ?? undefined;
  const type = (searchParams.get('type') ?? 'all') as 'title' | 'body' | 'all';
  const order = (searchParams.get('order') ?? 'title') as
    | 'title'
    | 'created'
    | 'edited';
  const way = (searchParams.get('way') ?? 'asc') as 'asc' | 'desc';
  const page = Number(searchParams.get('page') ?? 1);

  const { data, isLoading, error } = useGetWikiPagesQuery({
    q,
    type,
    order,
    way,
    page
  });

  const canCreate = hasAnyPermission(user, [
    'wiki_edit',
    'wiki_manage',
    'admin',
    'staff'
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('q', searchInput.trim());
    if (type !== 'all') next.set('type', type);
    if (order !== 'title') next.set('order', order);
    if (way !== 'asc') next.set('way', way);
    next.set('page', '1');
    setSearchParams(next);
  };

  const setSort = (newOrder: string, newWay: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('order', newOrder);
    next.set('way', newWay);
    next.set('page', '1');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const SortButton = ({
    label,
    field
  }: {
    label: string;
    field: 'title' | 'created' | 'edited';
  }) => {
    const isActive = order === field;
    const nextWay = isActive && way === 'asc' ? 'desc' : 'asc';
    return (
      <button
        onClick={() => setSort(field, nextWay)}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          isActive
            ? 'bg-indigo-700 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        {label} {isActive ? (way === 'asc' ? '↑' : '↓') : ''}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Wiki</h1>
        {canCreate && (
          <Link
            to="/private/wiki/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            + New Page
          </Link>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search wiki pages…"
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            Search
          </button>
          {q && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {/* Search type filter */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Search in:</span>
          {(['all', 'title', 'body'] as const).map((t) => (
            <label key={t} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value={t}
                checked={type === t}
                onChange={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('type', t);
                  setSearchParams(next);
                }}
                className="accent-indigo-500"
              />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
      </form>

      {/* Active filter indicator */}
      {q && (
        <p className="text-sm text-gray-400">
          Showing results for{' '}
          <span className="text-white">&ldquo;{q}&rdquo;</span>{' '}
          {type !== 'all' && (
            <span className="ml-1 text-gray-500">
              in {type === 'title' ? 'titles' : 'body text'}
            </span>
          )}
        </p>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort:</span>
        <SortButton label="Title" field="title" />
        <SortButton label="Created" field="created" />
        <SortButton label="Last edited" field="edited" />
      </div>

      {isLoading && <Spinner />}
      {error && (
        <div className="p-4 text-red-400">Failed to load wiki pages.</div>
      )}

      {data && data.data.length === 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-10 text-center">
          <p className="text-gray-500 text-sm">No pages found.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="space-y-2">
          {data.data.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-600 transition-colors"
            >
              <div>
                <Link
                  to={`/private/wiki/${p.id}`}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  {p.title}
                </Link>
                <div className="text-xs text-gray-500 mt-0.5">
                  rev {p.revision} · edited{' '}
                  {new Date(p.updatedAt).toLocaleDateString()} by{' '}
                  {p.author.username}
                  {p.minReadLevel > 0 && (
                    <span className="ml-2 text-amber-500">
                      restricted (level {p.minReadLevel})
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={`/private/wiki/${p.id}/history`}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                History
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(p));
                  setSearchParams(next);
                }}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default WikiListPage;
