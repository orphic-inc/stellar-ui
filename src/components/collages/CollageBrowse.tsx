import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useListCollagesQuery } from '../../store/services/collageApi';
import type { CollageOrderBy } from '../../types';
import Spinner from '../layout/Spinner';

const CATEGORIES = [
  { id: undefined, label: 'All' },
  { id: 1, label: 'Theme / Genre' },
  { id: 2, label: 'Discography' },
  { id: 3, label: 'Label' },
  { id: 4, label: 'Charts' },
  { id: 5, label: 'Staff Picks' },
  { id: 6, label: 'Other' }
];

const ORDER_OPTIONS: { value: CollageOrderBy; label: string }[] = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'updatedAt', label: 'Recently Updated' },
  { value: 'numEntries', label: 'Most Entries' },
  { value: 'numSubscribers', label: 'Most Subscribers' },
  { value: 'name', label: 'Name' }
];

const CollageBrowse = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<CollageOrderBy>('createdAt');

  const { data, isLoading, error } = useListCollagesQuery({
    page,
    search: search || undefined,
    categoryId,
    orderBy,
    order: 'desc'
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load collages.</div>;

  const collages = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Collages</h2>
        <Link
          to="/private/collages/new"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
        >
          New Collage
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search collages…"
          className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
        >
          Search
        </button>
      </form>

      <div className="flex gap-2 mb-3 flex-wrap text-sm">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={label}
            onClick={() => {
              setCategoryId(id);
              setPage(1);
            }}
            className={`px-3 py-1 rounded border ${
              categoryId === id
                ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-gray-400">Sort:</span>
        <select
          value={orderBy}
          onChange={(e) => {
            setOrderBy(e.target.value as CollageOrderBy);
            setPage(1);
          }}
          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-200 text-sm"
        >
          {ORDER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {collages.length === 0 ? (
        <p className="text-gray-500 text-sm">No collages found.</p>
      ) : (
        <div className="space-y-2">
          {collages.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between p-3 bg-gray-900/50 border border-gray-800 rounded hover:border-gray-700"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/private/collages/${c.id}`}
                    className="text-blue-400 hover:underline font-medium truncate"
                  >
                    {c.name}
                  </Link>
                  {c.isLocked && (
                    <span className="text-xs px-1.5 py-0.5 bg-yellow-900/40 text-yellow-400 rounded">
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">
                  {c.description}
                </p>
                {c.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="ml-4 text-right text-xs text-gray-500 shrink-0">
                <div>{c.numEntries} entries</div>
                <div>{c.numSubscribers} subscribers</div>
                <div className="mt-1">by {c.user?.username ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex gap-2 mt-4 text-sm items-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-gray-700 rounded disabled:opacity-40 hover:border-gray-500"
          >
            Prev
          </button>
          <span className="text-gray-400">
            Page {page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-gray-700 rounded disabled:opacity-40 hover:border-gray-500"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CollageBrowse;
