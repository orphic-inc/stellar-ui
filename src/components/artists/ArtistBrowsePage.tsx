import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useSearchArtistsQuery } from '../../store/services/searchApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';

const inputCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1';
const checkboxCls =
  'rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800';

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
      <h1 className="text-2xl font-bold text-white">Artists</h1>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="artist-q" className={labelCls}>
                Artist name
              </label>
              <input
                id="artist-q"
                name="q"
                defaultValue={q}
                className={inputCls}
                placeholder="Search artists…"
              />
            </div>
            <div>
              <label htmlFor="artist-tags" className={labelCls}>
                Tags (comma-separated)
              </label>
              <input
                id="artist-tags"
                name="tags"
                defaultValue={tags}
                className={inputCls}
                placeholder="e.g. jazz, blues"
              />
            </div>
            <div>
              <label htmlFor="artist-orderBy" className={labelCls}>
                Order
              </label>
              <div className="flex gap-2">
                <select
                  id="artist-orderBy"
                  name="orderBy"
                  defaultValue={orderBy}
                  className={inputCls}
                >
                  <option value="name">Name</option>
                  <option value="random">Random</option>
                </select>
                <select
                  name="order"
                  defaultValue={order}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
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
                  className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="tagMode"
                    value={v}
                    defaultChecked={tagMode === v}
                    className={checkboxCls}
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
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAdvanced ? '− Hide advanced options' : '+ Advanced options'}
            </button>
          )}
          {canAdvanced && showAdvanced && (
            <div className="border-t border-gray-700 pt-3">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="vanityHouse"
                  defaultChecked={!!vanityHouse}
                  className={checkboxCls}
                />
                Vanity House only
              </label>
            </div>
          )}

          <div className="flex gap-2">
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
          </div>
        </form>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load results.</p>}
      {data && (
        <>
          <p className="text-xs text-gray-500">
            {data.meta.total} artist{data.meta.total !== 1 ? 's' : ''}
          </p>
          {data.data.length === 0 ? (
            <p className="text-gray-400 text-sm">No artists found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Tags</th>
                    <th className="pb-2 font-medium text-right">Releases</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-gray-800/50 hover:bg-gray-900/30"
                    >
                      <td className="py-2 pr-4">
                        <Link
                          to={`/private/artists/${a.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          {a.name}
                        </Link>
                        {a.vanityHouse && (
                          <span className="ml-2 text-xs text-amber-500">
                            Vanity House
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {a.tags.slice(0, 5).map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-gray-400 text-right">
                        {a._count.releases}
                      </td>
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

export default ArtistBrowsePage;
