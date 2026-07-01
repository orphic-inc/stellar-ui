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
import { hasPermission } from '../../utils/permissions';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Open',
  filled: 'Filled'
};

const STATUS_TONE: Record<RequestStatus, BadgeVariant> = {
  open: 'info',
  filled: 'success'
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

// Color/border/bg come from the field Role (data-st="field" on each control);
// these constants carry only layout + focus.
const inputCls = 'text-sm rounded px-3 py-1.5 focus:outline-none';
const labelCls = 'block text-xs font-medium mb-1';

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
  const canCreateRequest = hasPermission(user, 'requests_create');

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Requests
        </h2>
        {canCreateRequest && (
          <Link
            to="/private/requests/new"
            data-st="control"
            data-st-primary
            className="text-sm"
          >
            New Request
          </Link>
        )}
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        data-st="panel"
        className="rounded-lg p-4 mb-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-q" data-st="meta" className={labelCls}>
              Search terms
            </label>
            <input
              id="req-q"
              name="q"
              defaultValue={q}
              data-st="field"
              className={inputCls + ' w-full'}
              placeholder="Title, description…"
            />
          </div>
          <div>
            <label htmlFor="req-artist" data-st="meta" className={labelCls}>
              Artist
            </label>
            <input
              id="req-artist"
              name="artist"
              defaultValue={artist}
              data-st="field"
              className={inputCls + ' w-full'}
            />
          </div>
          <div>
            <label htmlFor="req-type" data-st="meta" className={labelCls}>
              Type
            </label>
            <select
              id="req-type"
              name="type"
              defaultValue={type ?? ''}
              data-st="field"
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
            <label htmlFor="req-year" data-st="meta" className={labelCls}>
              Year
            </label>
            <input
              id="req-year"
              name="year"
              type="number"
              defaultValue={year}
              data-st="field"
              className={inputCls + ' w-full'}
              placeholder="e.g. 2020"
            />
          </div>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-1">
            <select
              name="orderBy"
              defaultValue={orderBy}
              data-st="field"
              className={inputCls}
            >
              <option value="createdAt">Time Added</option>
              <option value="voteCount">Votes</option>
              <option value="random">Random</option>
            </select>
            <select
              name="order"
              defaultValue={order}
              data-st="field"
              className={inputCls}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
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
            className="px-4 py-1.5 rounded border border-[var(--st-border)] text-sm"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Status filter — tab-strip pills painted from tokens, not a Role */}
      <div className="flex gap-2 mb-4 text-sm">
        {([undefined, 'open', 'filled'] as (RequestStatus | undefined)[]).map(
          (s) => (
            <button
              key={s ?? 'all'}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded border ${
                status === s
                  ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
                  : 'border-[var(--st-border)] text-[var(--st-text-muted)] hover:text-[var(--st-text)]'
              }`}
            >
              {s == null ? 'All' : STATUS_LABELS[s]}
            </button>
          )
        )}
      </div>

      {isLoading && <Spinner />}
      {error && (
        <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
          Failed to load requests.
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <p data-st="prose" data-st-muted className="text-sm">
          No requests found.
        </p>
      )}

      {requests.length > 0 && (
        <table data-st="grid" className="w-full text-sm">
          <thead data-st="colhead">
            <tr>
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
              <tr key={r.id} data-st="row">
                <td className="py-2 pr-4">
                  <Link to={`/private/requests/${r.id}`} data-st="control">
                    {r.title}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  <span data-st="meta">{r.type}</span>
                </td>
                <td className="py-2 pr-4">
                  <span data-st="meta">{r.community?.name ?? '—'}</span>
                </td>
                <td className="py-2 pr-4 text-right font-mono" data-st-num>
                  <span className="text-[var(--st-warning)]">
                    {getBountyCount(r) > 0 ? formatBytes(r.totalBounty) : '—'}
                  </span>
                </td>
                <td className="py-2 text-center">
                  <Badge variant={STATUS_TONE[r.status as RequestStatus]}>
                    {STATUS_LABELS[r.status as RequestStatus] ?? r.status}
                  </Badge>
                </td>
                <td className="py-2 text-right">
                  {user?.id === r.user?.id && r.status === 'open' && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      data-st="control"
                      data-st-danger
                      className="text-xs"
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
              className={`px-2.5 py-1 text-xs rounded border ${
                p === page
                  ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
                  : 'border-[var(--st-border)] text-[var(--st-text-muted)] hover:text-[var(--st-text)]'
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
