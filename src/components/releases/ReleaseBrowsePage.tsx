import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useSearchReleasesQuery,
  useSearchReleaseGroupsQuery
} from '../../store/services/searchApi';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import { RandomReleaseLink, RandomArtistLink } from '../search/RandomLinks';
import { formParamSetter, withPage } from '../../utils/searchParams';
import { PageNumbers } from '../ui';

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

// `/search/release-groups` takes every filter `/search/releases` takes, but a
// narrower sort vocabulary: `consumers`, `contributors` and `random` are
// release properties with no group analogue, and sending one is a 400 rather
// than a degraded sort. There is deliberately no member-count option either —
// the api can only count a group's whole relation, not the part this viewer may
// see, so ranking by it would expose a number including members they cannot
// reach (#320).
const GROUP_ORDER_BY_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'year', label: 'Year' },
  { value: 'createdAt', label: 'Time Added' }
];
const GROUP_ORDER_BY = new Set(GROUP_ORDER_BY_OPTIONS.map((o) => o.value));
const GROUP_DEFAULT_ORDER_BY = 'title';
const GROUP_DEFAULT_ORDER = 'asc';

// Layout-only class strings; paint comes from the `field`/`meta` Roles below.
// `field` carries the box treatment; `meta` paints labels; native
// radio/checkbox keep `field` for its accent-color (the box rules are inert on
// an appearance:auto control). See global.css §2a.
const inputCls = 'w-full';
const labelCls = 'block text-xs font-medium mb-1';

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
  const groupMode = searchParams.get('mode') === 'groups';
  const rawOrderBy = searchParams.get('orderBy');
  const rawOrder = searchParams.get('order') as 'asc' | 'desc' | null;
  // Group mode's sort vocabulary is narrower, so an orderBy carried across from
  // the release search is reconciled to the group default rather than sent. The
  // toggle preserves every filter, and a filter that produced a 400 would be a
  // worse trade than a changed sort.
  const orderBy =
    groupMode && !GROUP_ORDER_BY.has(rawOrderBy ?? '')
      ? GROUP_DEFAULT_ORDER_BY
      : (rawOrderBy ?? (groupMode ? GROUP_DEFAULT_ORDER_BY : 'createdAt'));
  const order =
    rawOrder ?? (groupMode ? GROUP_DEFAULT_ORDER : ('desc' as 'asc' | 'desc'));
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

  const searchArgs = {
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
    type: type as never,
    releaseType: releaseType as never,
    format: format as never,
    bitrate: bitrate as never,
    media: media as never,
    hasLog,
    hasCue,
    isScene,
    vanityHouse
  };

  // One hook per mode, the inactive one skipped. Both take the same arguments —
  // the two endpoints accept identical filters — so the toggle changes what a
  // row IS, not what was asked for.
  const releaseResult = useSearchReleasesQuery(searchArgs, { skip: groupMode });
  const groupResult = useSearchReleaseGroupsQuery(searchArgs, {
    skip: !groupMode
  });
  const { data, isLoading, error } = groupMode ? groupResult : releaseResult;
  const groupData = groupMode ? groupResult.data : undefined;
  const releaseData = groupMode ? undefined : releaseResult.data;

  // Same filters, other mode — used by the toggle and by the empty state's way
  // back out of group mode.
  const modeHref = (toGroups: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (toGroups) next.set('mode', 'groups');
    else next.delete('mode');
    next.delete('orderBy');
    next.delete('order');
    next.set('page', '1');
    return `?${next.toString()}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const set = formParamSetter(fd, next);

    // The form rebuilds the query string from scratch, so the mode has to be
    // re-stated or submitting a filter would silently leave group mode.
    if (groupMode) next.set('mode', 'groups');

    set('q');
    set('tags');
    const tm = fd.get('tagMode');
    if (tm && tm !== 'any') next.set('tagMode', String(tm));
    // Each mode has its own default, and omitting the default keeps the URL
    // short. Reconciliation on read is what makes omission safe.
    const defaultOrderBy = groupMode ? GROUP_DEFAULT_ORDER_BY : 'createdAt';
    const defaultOrder = groupMode ? GROUP_DEFAULT_ORDER : 'desc';
    const ob = fd.get('orderBy');
    if (ob && ob !== defaultOrderBy) next.set('orderBy', String(ob));
    const od = fd.get('order');
    if (od && od !== defaultOrder) next.set('order', String(od));

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

  const setPage = (p: number) => setSearchParams(withPage(searchParams, p));

  const communityList = Array.isArray(communities)
    ? communities
    : ((communities as { data?: { id: number; name: string }[] })?.data ?? []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 data-st="prose" data-st-strong className="text-2xl">
          Releases
        </h1>
        <div className="flex gap-4">
          <RandomReleaseLink />
          <RandomArtistLink />
        </div>
      </div>

      {/* Search form — the panel surface; inputs paint from `field`. */}
      <form onSubmit={handleSubmit} data-st="panel" className="p-4 space-y-4">
        {/* Basic row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="release-q" data-st="meta" className={labelCls}>
              Search terms
            </label>
            <input
              id="release-q"
              name="q"
              defaultValue={q}
              data-st="field"
              className={inputCls}
              placeholder="Artist, title, description…"
            />
          </div>
          <div>
            <label htmlFor="release-tags" data-st="meta" className={labelCls}>
              Tags (comma-separated)
            </label>
            <input
              id="release-tags"
              name="tags"
              defaultValue={tags}
              data-st="field"
              className={inputCls}
              placeholder="e.g. jazz, blues"
            />
          </div>
          <div>
            <label
              htmlFor="release-orderBy"
              data-st="meta"
              className={labelCls}
            >
              Order by
            </label>
            <div className="flex gap-2">
              <select
                id="release-orderBy"
                name="orderBy"
                defaultValue={orderBy}
                data-st="field"
                className={inputCls}
              >
                {(groupMode ? GROUP_ORDER_BY_OPTIONS : ORDER_BY_OPTIONS).map(
                  (o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  )
                )}
              </select>
              <select name="order" defaultValue={order} data-st="field">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
          <fieldset>
            <legend data-st="meta" className={labelCls}>
              Tags match
            </legend>
            <div className="flex gap-3 mt-2">
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
                  {v === 'any' ? 'Any' : 'All'}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Community checkboxes */}
        {communityList.length > 0 && (
          <fieldset>
            <legend data-st="meta" className={labelCls}>
              Communities
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {communityList.map((c: { id: number; name: string }) => (
                <label
                  key={c.id}
                  data-st="meta"
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="communityId"
                    value={c.id}
                    defaultChecked={communityIds.includes(c.id)}
                    data-st="field"
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
            data-st="control"
            className="text-xs"
          >
            {showAdvanced ? '− Hide advanced options' : '+ Advanced options'}
          </button>
        )}

        {/* Advanced fields */}
        {canAdvanced && showAdvanced && (
          <div className="border-t border-[var(--st-border)] pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="release-artist"
                  data-st="meta"
                  className={labelCls}
                >
                  Artist name
                </label>
                <input
                  id="release-artist"
                  name="artist"
                  defaultValue={artist}
                  data-st="field"
                  className={inputCls}
                />
              </div>
              <div>
                <label
                  htmlFor="release-title"
                  data-st="meta"
                  className={labelCls}
                >
                  Album/release name
                </label>
                <input
                  id="release-title"
                  name="title"
                  defaultValue={title}
                  data-st="field"
                  className={inputCls}
                />
              </div>
              <div>
                <label
                  htmlFor="release-recordLabel"
                  data-st="meta"
                  className={labelCls}
                >
                  Record label
                </label>
                <input
                  id="release-recordLabel"
                  name="recordLabel"
                  defaultValue={recordLabel}
                  data-st="field"
                  className={inputCls}
                />
              </div>
              <div>
                <label
                  htmlFor="release-catalogueNumber"
                  data-st="meta"
                  className={labelCls}
                >
                  Catalogue number
                </label>
                <input
                  id="release-catalogueNumber"
                  name="catalogueNumber"
                  defaultValue={catalogueNumber}
                  data-st="field"
                  className={inputCls}
                />
              </div>
              <div>
                <label
                  htmlFor="release-year"
                  data-st="meta"
                  className={labelCls}
                >
                  Year from
                </label>
                <input
                  id="release-year"
                  name="year"
                  type="number"
                  defaultValue={year}
                  data-st="field"
                  className={inputCls}
                  placeholder="e.g. 1990"
                />
              </div>
              <div>
                <label
                  htmlFor="release-yearTo"
                  data-st="meta"
                  className={labelCls}
                >
                  Year to
                </label>
                <input
                  id="release-yearTo"
                  name="yearTo"
                  type="number"
                  defaultValue={yearTo}
                  data-st="field"
                  className={inputCls}
                  placeholder="e.g. 2024"
                />
              </div>
              <div>
                <label
                  htmlFor="release-type"
                  data-st="meta"
                  className={labelCls}
                >
                  Release type
                </label>
                <select
                  id="release-type"
                  name="type"
                  defaultValue={type ?? ''}
                  data-st="field"
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
                <label
                  htmlFor="release-releaseType"
                  data-st="meta"
                  className={labelCls}
                >
                  Release category
                </label>
                <select
                  id="release-releaseType"
                  name="releaseType"
                  defaultValue={releaseType ?? ''}
                  data-st="field"
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
              <label
                htmlFor="release-description"
                data-st="meta"
                className={labelCls}
              >
                Release description
              </label>
              <input
                id="release-description"
                name="description"
                defaultValue={description}
                data-st="field"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="release-format"
                  data-st="meta"
                  className={labelCls}
                >
                  Format
                </label>
                <select
                  id="release-format"
                  name="format"
                  defaultValue={format ?? ''}
                  data-st="field"
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
                <label
                  htmlFor="release-bitrate"
                  data-st="meta"
                  className={labelCls}
                >
                  Bitrate
                </label>
                <input
                  id="release-bitrate"
                  name="bitrate"
                  defaultValue={bitrate}
                  data-st="field"
                  className={inputCls}
                  placeholder="e.g. 320, V0, Lossless"
                />
              </div>
              <div>
                <label
                  htmlFor="release-media"
                  data-st="meta"
                  className={labelCls}
                >
                  Media
                </label>
                <input
                  id="release-media"
                  name="media"
                  defaultValue={media}
                  data-st="field"
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
                  data-st="meta"
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={!!checked}
                    data-st="field"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 items-center">
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

      {/* Mode toggle (#320). Every filter carries across untouched — the two
          endpoints take identical ones — so this changes what a row IS, not
          what was asked for. `orderBy`/`order` are dropped rather than carried,
          because the vocabularies differ and a release-only value is a 400. */}
      <div data-st="meta" className="text-xs mb-2 flex gap-2 items-center">
        <span>Show</span>
        {groupMode ? (
          <Link to={modeHref(false)} data-st="control">
            releases
          </Link>
        ) : (
          <span data-st="prose" data-st-strong>
            releases
          </span>
        )}
        <span aria-hidden>·</span>
        {groupMode ? (
          <span data-st="prose" data-st-strong>
            albums
          </span>
        ) : (
          <Link to={modeHref(true)} data-st="control">
            albums
          </Link>
        )}
      </div>

      {/* Results */}
      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load results.</p>}
      {data && (
        <>
          <p data-st="prose" data-st-muted className="text-xs">
            {/* In group mode the row IS the group, so `total` counts albums
                rather than releases — that is the whole reason this is a
                separate endpoint instead of a flag on /search/releases. */}
            {data.meta.total}{' '}
            {groupMode
              ? `album${data.meta.total !== 1 ? 's' : ''}`
              : `result${data.meta.total !== 1 ? 's' : ''}`}
          </p>
          {data.data.length === 0 ? (
            groupMode ? (
              // Zero here does NOT mean the filters matched nothing. Grouping is
              // opt-in on the api side and never backfilled, so on an uncurated
              // catalogue EVERY group query is empty — "No releases found."
              // would be wrong for the majority of queries, not an edge case.
              <div data-st="prose" data-st-muted className="text-sm">
                <p>No grouped albums match these filters.</p>
                <p className="mt-1">
                  Grouping is opt-in — most releases are not part of a group
                  yet.{' '}
                  <Link to={modeHref(false)} data-st="control">
                    See these filters as releases
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <p data-st="prose" data-st-muted className="text-sm">
                No releases found.
              </p>
            )
          ) : groupMode && groupData ? (
            <div data-st="list">
              {groupData.data.map((g) => (
                <div key={g.id} data-st="row">
                  <div className="flex-1 min-w-0">
                    <span data-st="title" className="block truncate">
                      {g.title}
                    </span>
                    <span data-st="meta" data-st-em className="text-xs">
                      {g.artist?.name ?? '—'}
                      {g.year != null && ` · ${g.year}`}
                    </span>
                  </div>
                  {/* `releases` is the members THIS VIEWER may see — not every
                      member, and not only the ones that matched the query. A
                      group found by a 2001 release still lists every version of
                      the album the viewer can reach. */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    {g.releases.map((r) => (
                      <Link
                        key={r.id}
                        to={`/communities/${r.communityId ?? 0}/releases/${r.id}`}
                        data-st="chip"
                        className="text-xs"
                      >
                        {r.community?.name ?? `#${r.id}`}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Columnar data: keep the <table> so columns stay aligned; the
                  grid/colhead/row variant (ADR-0006) carries the token paint. */}
              <table data-st="grid" className="text-sm">
                <thead data-st="colhead">
                  <tr>
                    <th>Title / Artist</th>
                    <th data-st-num>Year</th>
                    <th>Category</th>
                    <th>Tags</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {(releaseData?.data ?? []).map((r) => (
                    <tr key={r.id} data-st="row">
                      <td>
                        {r.communityId ? (
                          <Link
                            to={`/communities/${r.communityId}/releases/${r.id}`}
                            data-st="title"
                          >
                            {r.title}
                          </Link>
                        ) : (
                          <span data-st="prose" data-st-strong>
                            {r.title}
                          </span>
                        )}
                        {r.artist && (
                          <>
                            <span data-st="meta" className="mx-1">
                              —
                            </span>
                            <Link
                              to={`/artists/${r.artist.id}`}
                              data-st="meta"
                              data-st-em
                            >
                              {r.artist.name}
                            </Link>
                          </>
                        )}
                      </td>
                      <td data-st-num>{r.year}</td>
                      <td>
                        <span data-st="meta">{r.releaseType}</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {r.tags.slice(0, 4).map((t) => (
                            <span key={t.id} data-st="chip">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <span data-st="meta" className="text-xs">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          <PageNumbers
            page={page}
            totalPages={data.meta.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default ReleaseBrowsePage;
