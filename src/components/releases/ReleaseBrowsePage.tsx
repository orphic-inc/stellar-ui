import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSearchReleasesQuery } from '../../store/services/searchApi';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import { RandomReleaseLink, RandomArtistLink } from '../search/RandomLinks';

const RELEASE_TYPES = [
  'Music',
  'Applications',
  'EBooks',
  'ELearningVideos',
  'Audiobooks',
  'Comedy',
  'Comics'
];
const RELEASE_CATEGORIES = [
  'Album',
  'Single',
  'EP',
  'Anthology',
  'Compilation',
  'DJMix',
  'Live',
  'Remix',
  'Bootleg',
  'Interview',
  'Mixtape',
  'Demo',
  'ConcertRecording',
  'Unknown'
];
const FILE_TYPES = ['mp3', 'flac', 'wav', 'ogg', 'aac', 'm4a'];
const ORDER_BY_OPTIONS = [
  { value: 'createdAt', label: 'Time Added' },
  { value: 'year', label: 'Year' },
  { value: 'consumers', label: 'Consumers' },
  { value: 'contributors', label: 'Contributors' },
  { value: 'random', label: 'Random' }
];

const inputCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1';
const checkboxCls =
  'rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800';

const ReleaseBrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: user } = useGetMeQuery();
  const { data: communities } = useGetCommunitiesQuery(1);
  const canAdvanced = hasPermission(user, 'advanced_search');

  // Read params
  const q = searchParams.get('q') ?? undefined;
  const tags = searchParams.get('tags') ?? undefined;
  const tagMode = (searchParams.get('tagMode') ?? 'any') as 'any' | 'all';
  const orderBy = searchParams.get('orderBy') ?? 'createdAt';
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';
  const page = Number(searchParams.get('page') ?? 1);
  const communityIds = searchParams
    .getAll('communityId')
    .map(Number)
    .filter(Boolean);
  // Advanced
  const artist = searchParams.get('artist') ?? undefined;
  const title = searchParams.get('title') ?? undefined;
  const recordLabel = searchParams.get('recordLabel') ?? undefined;
  const catalogueNumber = searchParams.get('catalogueNumber') ?? undefined;
  const year = searchParams.get('year')
    ? Number(searchParams.get('year'))
    : undefined;
  const yearTo = searchParams.get('yearTo')
    ? Number(searchParams.get('yearTo'))
    : undefined;
  const description = searchParams.get('description') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const releaseType = searchParams.get('releaseType') ?? undefined;
  const format = searchParams.get('format') ?? undefined;
  const bitrate = searchParams.get('bitrate') ?? undefined;
  const media = searchParams.get('media') ?? undefined;
  const hasLog =
    searchParams.get('hasLog') === 'true'
      ? true
      : searchParams.get('hasLog') === 'false'
      ? false
      : undefined;
  const hasCue =
    searchParams.get('hasCue') === 'true'
      ? true
      : searchParams.get('hasCue') === 'false'
      ? false
      : undefined;
  const isScene =
    searchParams.get('isScene') === 'true'
      ? true
      : searchParams.get('isScene') === 'false'
      ? false
      : undefined;
  const vanityHouse =
    searchParams.get('vanityHouse') === 'true' ? true : undefined;

  const { data, isLoading, error } = useSearchReleasesQuery({
    q,
    tags,
    tagMode,
    orderBy: orderBy as never,
    order,
    page,
    communityId: communityIds.length ? communityIds : undefined,
    artist,
    title,
    recordLabel,
    catalogueNumber,
    year,
    yearTo,
    description,
    type,
    releaseType,
    format,
    bitrate,
    media,
    hasLog,
    hasCue,
    isScene,
    vanityHouse
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
    if (ob && ob !== 'createdAt') next.set('orderBy', String(ob));
    const od = fd.get('order');
    if (od && od !== 'desc') next.set('order', String(od));

    const cids = fd.getAll('communityId');
    cids.forEach((id) => next.append('communityId', String(id)));

    if (canAdvanced) {
      set('artist');
      set('title');
      set('recordLabel');
      set('catalogueNumber');
      set('year');
      set('yearTo');
      set('description');
      set('type');
      set('releaseType');
      set('format');
      set('bitrate');
      set('media');
      if (fd.get('hasLog')) next.set('hasLog', 'true');
      if (fd.get('hasCue')) next.set('hasCue', 'true');
      if (fd.get('isScene')) next.set('isScene', 'true');
      if (fd.get('vanityHouse')) next.set('vanityHouse', 'true');
    }

    next.set('page', '1');
    setSearchParams(next);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  const communityList = Array.isArray(communities)
    ? communities
    : (communities as { data?: { id: number; name: string }[] })?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Releases</h1>
        <div className="flex gap-4">
          <RandomReleaseLink />
          <RandomArtistLink />
        </div>
      </div>

      {/* Search form */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="release-q" className={labelCls}>
                Search terms
              </label>
              <input
                id="release-q"
                name="q"
                defaultValue={q}
                className={inputCls}
                placeholder="Artist, title, description…"
              />
            </div>
            <div>
              <label htmlFor="release-tags" className={labelCls}>
                Tags (comma-separated)
              </label>
              <input
                id="release-tags"
                name="tags"
                defaultValue={tags}
                className={inputCls}
                placeholder="e.g. jazz, blues"
              />
            </div>
            <div>
              <label htmlFor="release-orderBy" className={labelCls}>
                Order by
              </label>
              <div className="flex gap-2">
                <select
                  id="release-orderBy"
                  name="orderBy"
                  defaultValue={orderBy}
                  className={inputCls}
                >
                  {ORDER_BY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  name="order"
                  defaultValue={order}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
            <fieldset>
              <legend className={labelCls}>Tags match</legend>
              <div className="flex gap-3 mt-2">
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
                    {v === 'any' ? 'Any' : 'All'}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Community checkboxes */}
          {communityList.length > 0 && (
            <fieldset>
              <legend className={labelCls}>Communities</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {communityList.map((c: { id: number; name: string }) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="communityId"
                      value={c.id}
                      defaultChecked={communityIds.includes(c.id)}
                      className={checkboxCls}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Advanced toggle */}
          {canAdvanced && (
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAdvanced ? '− Hide advanced options' : '+ Advanced options'}
            </button>
          )}

          {/* Advanced fields */}
          {canAdvanced && showAdvanced && (
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="release-artist" className={labelCls}>
                    Artist name
                  </label>
                  <input
                    id="release-artist"
                    name="artist"
                    defaultValue={artist}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="release-title" className={labelCls}>
                    Album/release name
                  </label>
                  <input
                    id="release-title"
                    name="title"
                    defaultValue={title}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="release-recordLabel" className={labelCls}>
                    Record label
                  </label>
                  <input
                    id="release-recordLabel"
                    name="recordLabel"
                    defaultValue={recordLabel}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="release-catalogueNumber" className={labelCls}>
                    Catalogue number
                  </label>
                  <input
                    id="release-catalogueNumber"
                    name="catalogueNumber"
                    defaultValue={catalogueNumber}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="release-year" className={labelCls}>
                    Year from
                  </label>
                  <input
                    id="release-year"
                    name="year"
                    type="number"
                    defaultValue={year}
                    className={inputCls}
                    placeholder="e.g. 1990"
                  />
                </div>
                <div>
                  <label htmlFor="release-yearTo" className={labelCls}>
                    Year to
                  </label>
                  <input
                    id="release-yearTo"
                    name="yearTo"
                    type="number"
                    defaultValue={yearTo}
                    className={inputCls}
                    placeholder="e.g. 2024"
                  />
                </div>
                <div>
                  <label htmlFor="release-type" className={labelCls}>
                    Release type
                  </label>
                  <select
                    id="release-type"
                    name="type"
                    defaultValue={type ?? ''}
                    className={inputCls}
                  >
                    <option value="">Any</option>
                    {RELEASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="release-releaseType" className={labelCls}>
                    Release category
                  </label>
                  <select
                    id="release-releaseType"
                    name="releaseType"
                    defaultValue={releaseType ?? ''}
                    className={inputCls}
                  >
                    <option value="">Any</option>
                    {RELEASE_CATEGORIES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="release-description" className={labelCls}>
                  Release description
                </label>
                <input
                  id="release-description"
                  name="description"
                  defaultValue={description}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="release-format" className={labelCls}>
                    Format
                  </label>
                  <select
                    id="release-format"
                    name="format"
                    defaultValue={format ?? ''}
                    className={inputCls}
                  >
                    <option value="">Any</option>
                    {FILE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="release-bitrate" className={labelCls}>
                    Bitrate
                  </label>
                  <input
                    id="release-bitrate"
                    name="bitrate"
                    defaultValue={bitrate}
                    className={inputCls}
                    placeholder="e.g. 320, V0, Lossless"
                  />
                </div>
                <div>
                  <label htmlFor="release-media" className={labelCls}>
                    Media
                  </label>
                  <input
                    id="release-media"
                    name="media"
                    defaultValue={media}
                    className={inputCls}
                    placeholder="e.g. CD, Vinyl, WEB"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { name: 'hasLog', label: 'Has Log', checked: hasLog },
                  { name: 'hasCue', label: 'Has Cue', checked: hasCue },
                  { name: 'isScene', label: 'Scene', checked: isScene },
                  {
                    name: 'vanityHouse',
                    label: 'Vanity House',
                    checked: vanityHouse
                  }
                ].map(({ name, label, checked }) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name={name}
                      defaultChecked={!!checked}
                      className={checkboxCls}
                    />
                    {label}
                  </label>
                ))}
              </div>
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

      {/* Results */}
      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load results.</p>}
      {data && (
        <>
          <p className="text-xs text-gray-500">
            {data.meta.total} result{data.meta.total !== 1 ? 's' : ''}
          </p>
          {data.data.length === 0 ? (
            <p className="text-gray-400 text-sm">No releases found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-2 font-medium">Title / Artist</th>
                    <th className="pb-2 font-medium">Year</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Tags</th>
                    <th className="pb-2 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-800/50 hover:bg-gray-900/30"
                    >
                      <td className="py-2 pr-4">
                        {r.communityId ? (
                          <Link
                            to={`/private/communities/${r.communityId}/releases/${r.id}`}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            {r.title}
                          </Link>
                        ) : (
                          <span className="text-gray-200 font-medium">
                            {r.title}
                          </span>
                        )}
                        <span className="text-gray-500 mx-1">—</span>
                        <Link
                          to={`/private/artists/${r.artist.id}`}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          {r.artist.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-gray-400">{r.year}</td>
                      <td className="py-2 pr-4 text-gray-400">
                        {r.releaseType}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {r.tags.slice(0, 4).map((t) => (
                            <span
                              key={t.id}
                              className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
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

export default ReleaseBrowsePage;
