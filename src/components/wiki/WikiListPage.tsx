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
            ? 'bg-[color-mix(in_oklch,var(--st-accent)_20%,transparent)] text-[var(--st-text-strong)]'
            : 'text-[var(--st-text-muted)] hover:text-[var(--st-text)] hover:bg-[var(--st-raised)]'
        }`}
      >
        {label} {isActive ? (way === 'asc' ? '↑' : '↓') : ''}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 data-st="prose" data-st-strong className="text-2xl">
          Wiki
        </h1>
        {canCreate && (
          <Link
            to="/wiki/new"
            data-st="control"
            data-st-primary
            className="text-sm"
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
            data-st="field"
            className="flex-1"
          />
          <button
            type="submit"
            data-st="control"
            data-st-primary
            className="text-sm"
          >
            Search
          </button>
          {q && (
            <button
              type="button"
              onClick={clearFilters}
              data-st="control"
              className="text-sm"
            >
              Clear
            </button>
          )}
        </div>
        {/* Search type filter */}
        <div data-st="meta" className="flex items-center gap-2 text-xs">
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
                data-st="field"
              />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
      </form>

      {/* Active filter indicator */}
      {q && (
        <p data-st="prose" data-st-muted className="text-sm">
          Showing results for{' '}
          <span data-st="prose" data-st-strong>
            &ldquo;{q}&rdquo;
          </span>{' '}
          {type !== 'all' && (
            <span data-st="meta" className="ml-1">
              in {type === 'title' ? 'titles' : 'body text'}
            </span>
          )}
        </p>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span data-st="meta" className="text-xs">
          Sort:
        </span>
        <SortButton label="Title" field="title" />
        <SortButton label="Created" field="created" />
        <SortButton label="Last edited" field="edited" />
      </div>

      {isLoading && <Spinner />}
      {error && (
        <div className="p-4 text-red-400">Failed to load wiki pages.</div>
      )}

      {data && data.data.length === 0 && (
        <div data-st="panel" className="px-6 py-10 text-center">
          <p data-st="meta" className="text-sm">
            No pages found.
          </p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <div data-st="panel">
          <div data-st="list">
            {data.data.map((p) => (
              <div key={p.id} data-st="row" className="justify-between">
                <div>
                  <Link to={`/wiki/${p.id}`} data-st="title">
                    {p.title}
                  </Link>
                  <div data-st="meta" className="text-xs mt-0.5">
                    rev {p.revision} · edited{' '}
                    {new Date(p.updatedAt).toLocaleDateString()} by{' '}
                    {p.author.username}
                    {p.minReadLevel > 0 && (
                      <span className="ml-2 text-[var(--st-warning)]">
                        restricted (level {p.minReadLevel})
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/wiki/${p.id}/history`}
                  data-st="control"
                  className="text-xs"
                >
                  History
                </Link>
              </div>
            ))}
          </div>
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
                data-st="control"
                data-st-primary={p === page ? '' : undefined}
                className="px-3 py-1 text-sm"
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
