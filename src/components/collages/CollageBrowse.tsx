import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useListCollagesQuery } from '../../store/services/collageApi';
import type { CollageOrderBy } from '../../types';
import Spinner from '../layout/Spinner';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { hasPermission } from '../../utils/permissions';
import DOMPurify from 'dompurify';
import {
  BBCODE_ALLOWED_TAGS,
  BBCODE_ALLOWED_ATTR
} from '../../utils/bbcodeSanitize';

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
  const currentUser = useSelector(selectCurrentUser);
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
  const canCreateCollage = hasPermission(currentUser, 'collages_create');

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Collages
        </h2>
        {canCreateCollage && (
          <Link
            to="/collages/new"
            data-st="control"
            data-st-primary
            className="text-sm"
          >
            New Collage
          </Link>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search collages…"
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
      </form>

      {/* Category filter — a tab-strip; token utilities paint the active/idle
          state directly, no Role (the WS8 tab pattern). */}
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
                ? 'border-[var(--st-accent)] bg-[color-mix(in_oklch,var(--st-accent)_20%,transparent)] text-[var(--st-text-strong)]'
                : 'border-[var(--st-border)] text-[var(--st-text-muted)] hover:border-[var(--st-border-strong)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <span data-st="meta">Sort:</span>
        <select
          value={orderBy}
          onChange={(e) => {
            setOrderBy(e.target.value as CollageOrderBy);
            setPage(1);
          }}
          data-st="field"
        >
          {ORDER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {collages.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          No collages found.
        </p>
      ) : (
        <div data-st="panel">
          <div data-st="list">
            {collages.map((c) => (
              <div key={c.id} data-st="row" className="items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/collages/${c.id}`}
                      data-st="title"
                      className="truncate"
                    >
                      {c.name}
                    </Link>
                    {c.isLocked && (
                      <span data-st="chip" data-st-warning>
                        Locked
                      </span>
                    )}
                  </div>
                  <div
                    data-st="meta"
                    className="text-xs line-clamp-2 bbcode-content"
                    dangerouslySetInnerHTML={{
                      // Server-transcribed HTML (#398/#402); mirrored-allowlist
                      // DOMPurify is the second net.
                      __html: DOMPurify.sanitize(c.descriptionHtml ?? '', {
                        ALLOWED_TAGS: BBCODE_ALLOWED_TAGS,
                        ALLOWED_ATTR: BBCODE_ALLOWED_ATTR
                      })
                    }}
                  />
                  {c.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {c.tags.map((tag) => (
                        <span key={tag} data-st="chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 text-right text-xs shrink-0 space-y-0.5">
                  <div data-st="meta" data-st-num>
                    {c.numEntries} entries
                  </div>
                  <div data-st="meta" data-st-num>
                    {c.numSubscribers} subscribers
                  </div>
                  <div data-st="meta">by {c.user?.username ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex gap-2 mt-4 text-sm items-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            data-st="control"
            className="px-3 py-1 border border-[var(--st-border)] rounded disabled:opacity-40 hover:border-[var(--st-border-strong)]"
          >
            Prev
          </button>
          <span data-st="meta">
            Page {page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            data-st="control"
            className="px-3 py-1 border border-[var(--st-border)] rounded disabled:opacity-40 hover:border-[var(--st-border-strong)]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CollageBrowse;
