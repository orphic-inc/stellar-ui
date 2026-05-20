import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useDeleteRequestMutation,
  useListRequestsQuery,
  type ReleaseType
} from '../../store/services/requestApi';
import type { RequestStatus } from '../../types';
import Spinner from '../layout/Spinner';

const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Open',
  filled: 'Filled'
};

const RELEASE_TYPES: ReleaseType[] = [
  'Music',
  'Applications',
  'EBooks',
  'ELearningVideos',
  'Audiobooks',
  'Comedy',
  'Comics'
];

function formatBytes(bytesStr?: string | null): string {
  const bytes = Number(bytesStr);
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${bytes} B`;
}

function getBountyCount(request: {
  _count?: { bounties: number };
  bounties?: Array<unknown>;
}) {
  return request._count?.bounties ?? request.bounties?.length ?? 0;
}

const inputCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1';

const RequestsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') ?? undefined;
  const artist = searchParams.get('artist') ?? undefined;
  const typeParam = searchParams.get('type');
  const type = RELEASE_TYPES.includes(typeParam as ReleaseType)
    ? (typeParam as ReleaseType)
    : undefined;
  const year = searchParams.get('year')
    ? Number(searchParams.get('year'))
    : undefined;
  const status = (searchParams.get('status') ?? undefined) as
    | RequestStatus
    | undefined;
  const orderBy = (searchParams.get('orderBy') ?? 'createdAt') as
    | 'createdAt'
    | 'voteCount'
    | 'random';
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';
  const page = Number(searchParams.get('page') ?? 1);

  const { data, isLoading, error } = useListRequestsQuery({
    q,
    artist,
    type,
    year,
    status,
    orderBy,
    order,
    page
  });
  const [deleteRequest] = useDeleteRequestMutation();

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        'Delete this request? Bounties on open requests will be refunded.'
      )
    )
      return;
    try {
      await deleteRequest(id).unwrap();
    } catch {
      alert('Failed to delete request.');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const set = (k: string) => {
      const v = fd.get(k);
      if (v && String(v).trim()) next.set(k, String(v).trim());
    };
    set('q');
    set('artist');
    set('year');
    const tv = fd.get('type');
    if (tv && String(tv)) next.set('type', String(tv));
    const sv = fd.get('status');
    if (sv && String(sv)) next.set('status', String(sv));
    const ob = fd.get('orderBy');
    if (ob && ob !== 'createdAt') next.set('orderBy', String(ob));
    const od = fd.get('order');
    if (od && od !== 'desc') next.set('order', String(od));
    next.set('page', '1');
    setSearchParams(next);
  };

  const setStatus = (s: RequestStatus | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (s) next.set('status', s);
    else next.delete('status');
    next.set('page', '1');
    setSearchParams(next);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  const requests = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Requests</h2>
        <Link
          to="/private/requests/new"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
        >
          New Request
        </Link>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-q" className={labelCls}>
              Search terms
            </label>
            <input
              id="req-q"
              name="q"
              defaultValue={q}
              className={inputCls + ' w-full'}
              placeholder="Title, description…"
            />
          </div>
          <div>
            <label htmlFor="req-artist" className={labelCls}>
              Artist
            </label>
            <input
              id="req-artist"
              name="artist"
              defaultValue={artist}
              className={inputCls + ' w-full'}
            />
          </div>
          <div>
            <label htmlFor="req-type" className={labelCls}>
              Type
            </label>
            <select
              id="req-type"
              name="type"
              defaultValue={type ?? ''}
              className={inputCls + ' w-full'}
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
            <label htmlFor="req-year" className={labelCls}>
              Year
            </label>
            <input
              id="req-year"
              name="year"
              type="number"
              defaultValue={year}
              className={inputCls + ' w-full'}
              placeholder="e.g. 2020"
            />
          </div>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-1">
            <select name="orderBy" defaultValue={orderBy} className={inputCls}>
              <option value="createdAt">Time Added</option>
              <option value="voteCount">Votes</option>
              <option value="random">Random</option>
            </select>
            <select name="order" defaultValue={order} className={inputCls}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
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

      {/* Status filter */}
      <div className="flex gap-2 mb-4 text-sm">
        {([undefined, 'open', 'filled'] as (RequestStatus | undefined)[]).map(
          (s) => (
            <button
              key={s ?? 'all'}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded border ${
                status === s
                  ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {s == null ? 'All' : STATUS_LABELS[s]}
            </button>
          )
        )}
      </div>

      {isLoading && <Spinner />}
      {error && (
        <div className="p-4 text-red-400">Failed to load requests.</div>
      )}

      {!isLoading && requests.length === 0 && (
        <p className="text-gray-500 text-sm">No requests found.</p>
      )}

      {requests.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2">Title</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Community</th>
              <th className="pb-2 text-right">Bounty</th>
              <th className="pb-2 text-center">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr
                key={r.id}
                className="border-b border-gray-800/60 hover:bg-gray-900/30"
              >
                <td className="py-2 pr-4">
                  <Link
                    to={`/private/requests/${r.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-gray-400">{r.type}</td>
                <td className="py-2 pr-4 text-gray-400">
                  {r.community?.name ?? '—'}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-yellow-400">
                  {getBountyCount(r) > 0 ? formatBytes(r.totalBounty) : '—'}
                </td>
                <td className="py-2 text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'filled'
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {STATUS_LABELS[r.status as RequestStatus] ?? r.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {user?.id === r.user?.id && r.status === 'open' && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex gap-1 mt-4 flex-wrap">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
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
    </div>
  );
};

export default RequestsPage;
