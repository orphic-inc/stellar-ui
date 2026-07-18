import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useSearchArtistsQuery } from '../../store/services/searchApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';

// Layout-only class strings; paint comes from the `field`/`meta` Roles below.
// Native radio/checkbox keep `field` for its accent-color (the box rules are
// inert on an appearance:auto control). See ReleaseBrowsePage / global.css §2a.
const inputCls = 'w-full';
const labelCls = 'block text-xs font-medium mb-1';

const ArtistBrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: user } = useGetMeQuery();
  const canAdvanced = hasPermission(user, 'advanced_search');

  const q = searchParams.get('q') ?? undefined;
  const tags = searchParams.get('tags') ?? undefined;
  const tagMode = (searchParams.get('tagMode') ?? 'any') as 'any' | 'all';
  const orderBy = (searchParams.get('orderBy') ?? 'name') as 'name' | 'random';
  const order = (searchParams.get('order') ?? 'asc') as 'asc' | 'desc';
  const vanityHouse =
    searchParams.get('vanityHouse') === 'true' ? true : undefined;
  const page = Number(searchParams.get('page') ?? 1);

  const { data, isLoading, error } = useSearchArtistsQuery({
    q,
    tags,
    tagMode,
    orderBy,
    order,
    vanityHouse,
    page
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const set = (k: string) => {
      const v = fd.get(k);
      if (v && String(v).trim()) next.set(k, String(v).trim());
    };
    set('q');
    set('tags');
    const tm = fd.get('tagMode');
    if (tm && tm !== 'any') next.set('tagMode', String(tm));
    const ob = fd.get('orderBy');
    if (ob && ob !== 'name') next.set('orderBy', String(ob));
    const od = fd.get('order');
    if (od && od !== 'asc') next.set('order', String(od));
    if (canAdvanced && fd.get('vanityHouse')) next.set('vanityHouse', 'true');
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
        Artists
      </h1>

      <div data-st="panel" className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="artist-q" data-st="meta" className={labelCls}>
                Artist name
              </label>
              <input
                id="artist-q"
                name="q"
                defaultValue={q}
                data-st="field"
                className={inputCls}
                placeholder="Search artists…"
              />
            </div>
            <div>
              <label htmlFor="artist-tags" data-st="meta" className={labelCls}>
                Tags (comma-separated)
              </label>
              <input
                id="artist-tags"
                name="tags"
                defaultValue={tags}
                data-st="field"
                className={inputCls}
                placeholder="e.g. jazz, blues"
              />
            </div>
            <div>
              <label
                htmlFor="artist-orderBy"
                data-st="meta"
                className={labelCls}
              >
                Order
              </label>
              <div className="flex gap-2">
                <select
                  id="artist-orderBy"
                  name="orderBy"
                  defaultValue={orderBy}
                  data-st="field"
                  className={inputCls}
                >
                  <option value="name">Name</option>
                  <option value="random">Random</option>
                </select>
                <select name="order" defaultValue={order} data-st="field">
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              {(['any', 'all'] as const).map((v) => (
                <label
                  key={v}
                  data-st="meta"
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="tagMode"
                    value={v}
                    defaultChecked={tagMode === v}
                    data-st="field"
                  />
                  Tags: {v === 'any' ? 'Any' : 'All'}
                </label>
              ))}
            </div>
          </div>

          {canAdvanced && (
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              data-st="control"
              className="text-xs"
            >
              {showAdvanced ? '− Hide advanced options' : '+ Advanced options'}
            </button>
          )}
          {canAdvanced && showAdvanced && (
            <div className="border-t border-[var(--st-border)] pt-3">
              <label
                data-st="meta"
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="vanityHouse"
                  defaultChecked={!!vanityHouse}
                  data-st="field"
                />
                Vanity House only
              </label>
            </div>
          )}

          <div className="flex gap-2">
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
          </div>
        </form>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load results.</p>}
      {data && (
        <>
          <p data-st="prose" data-st-muted className="text-xs">
            {data.meta.total} artist{data.meta.total !== 1 ? 's' : ''}
          </p>
          {data.data.length === 0 ? (
            <p data-st="prose" data-st-muted className="text-sm">
              No artists found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              {/* Columnar data keeps its <table>; the grid/colhead/row variant
                  (ADR-0006) carries the token paint. */}
              <table data-st="grid" className="text-sm">
                <thead data-st="colhead">
                  <tr>
                    <th>Name</th>
                    <th>Tags</th>
                    <th data-st-num>Releases</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((a) => (
                    <tr key={a.id} data-st="row">
                      <td>
                        <Link to={`/artists/${a.id}`} data-st="title">
                          {a.name}
                        </Link>
                        {a.vanityHouse && (
                          <span
                            data-st="meta"
                            data-st-em
                            className="ml-2 text-xs"
                          >
                            Vanity House
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {a.tags.slice(0, 5).map(({ tag }) => (
                            <span key={tag.id} data-st="chip">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td data-st-num>{a._count.releases}</td>
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

export default ArtistBrowsePage;
