import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetRequestQuery,
  useAddBountyMutation,
  useFillRequestMutation,
  useUnfillRequestMutation,
  useDeleteRequestMutation,
  useToggleRequestVoteMutation,
  useGetRequestBountyHistoryQuery
} from '../../store/services/requestApi';
import { useToggleRequestBookmarkMutation } from '../../store/services/bookmarkApi';
import Spinner from '../layout/Spinner';
import CommentsSection from '../layout/CommentsSection';
import { addAlert } from '../../store/slices/alertSlice';
import { useAppDispatch } from '../../store/hooks';
import { canUseRequestModeration } from '../staff/staffAffordances';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const STATUS_TONE: Record<string, BadgeVariant> = {
  open: 'info',
  filled: 'success'
};

const RequestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useSelector(selectCurrentUser);
  const requestId = Number(id);

  const {
    data: req,
    isLoading,
    error
  } = useGetRequestQuery(requestId, {
    skip: isNaN(requestId)
  });

  const [addBounty, { isLoading: addingBounty }] = useAddBountyMutation();
  const [fillRequest, { isLoading: filling }] = useFillRequestMutation();
  const [unfillRequest, { isLoading: unfilling }] = useUnfillRequestMutation();
  const [deleteRequest, { isLoading: deleting }] = useDeleteRequestMutation();
  const [toggleVote, { isLoading: voting }] = useToggleRequestVoteMutation();
  const [toggleBookmark, { isLoading: bookmarking }] =
    useToggleRequestBookmarkMutation();
  const [showBountyHistory, setShowBountyHistory] = useState(false);
  const { data: bountyHistory } = useGetRequestBountyHistoryQuery(requestId, {
    skip: !showBountyHistory
  });

  const [bountyInput, setBountyInput] = useState('');
  const [fillContribId, setFillContribId] = useState('');
  const [unfillReason, setUnfillReason] = useState('');

  const canModerateRequest = canUseRequestModeration(user);
  const isOwner = user?.id === req?.userId;

  const handleVote = async () => {
    try {
      await toggleVote(requestId).unwrap();
    } catch {
      dispatch(addAlert('Failed to vote.', 'danger'));
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(requestId).unwrap();
      dispatch(
        addAlert(
          result.bookmarked ? 'Request bookmarked.' : 'Bookmark removed.',
          'success'
        )
      );
    } catch {
      dispatch(addAlert('Failed to update bookmark.', 'danger'));
    }
  };

  const handleAddBounty = async () => {
    if (!bountyInput) return;
    try {
      await addBounty({ requestId, amount: bountyInput }).unwrap();
      setBountyInput('');
      dispatch(addAlert('Bounty added.', 'success'));
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ??
        'Failed to add bounty.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  const handleFill = async () => {
    const contribId = parseInt(fillContribId, 10);
    if (!contribId) return;
    try {
      await fillRequest({ requestId, contributionId: contribId }).unwrap();
      setFillContribId('');
      dispatch(addAlert('Request filled!', 'success'));
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ??
        'Failed to fill request.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  const handleUnfill = async () => {
    try {
      await unfillRequest({
        requestId,
        reason: unfillReason || undefined
      }).unwrap();
      setUnfillReason('');
      dispatch(addAlert('Request unfilled.', 'success'));
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ??
        'Failed to unfill request.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this request?')) return;
    try {
      await deleteRequest(requestId).unwrap();
      navigate('/private/requests');
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ?? 'Failed to delete.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !req)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Request not found.
      </div>
    );

  const totalBountyDisplay = formatBytes(req.totalBounty);
  const canDelete = (isOwner && req.status === 'open') || canModerateRequest;
  const canFill = req.status === 'open' && !!user;
  const canUnfill = req.status === 'filled' && canModerateRequest;

  return (
    <div className="thin space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h2 data-st="prose" data-st-strong className="text-xl">
            {req.title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                title="Bookmark"
                data-st="control"
                className="px-2.5 py-1 rounded border border-[var(--st-border)] text-sm disabled:opacity-50"
              >
                🔖
              </button>
            )}
            <Badge variant={STATUS_TONE[req.status] ?? 'default'}>
              {req.status}
            </Badge>
          </div>
        </div>
        <div
          data-st="meta"
          className="text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1"
        >
          <span>Type: {req.type}</span>
          {req.year && <span>Year: {req.year}</span>}
          {req.community && <span>Community: {req.community.name}</span>}
          {req.user && (
            <span>
              By{' '}
              <Link to={`/private/user/${req.user.username}`} data-st="control">
                {req.user.username}
              </Link>
            </span>
          )}
          {user && (
            <button
              onClick={handleVote}
              disabled={voting}
              data-st="control"
              className="flex items-center gap-1 disabled:opacity-50"
            >
              {' '}
              <span>
                ▲ {(req as { voteCount?: number }).voteCount ?? 0} votes
              </span>
            </button>
          )}
        </div>
      </div>

      {req.description && (
        <p data-st="prose" className="text-sm whitespace-pre-wrap">
          {req.description}
        </p>
      )}

      <div data-st="panel" className="rounded p-4">
        <div className="text-2xl font-mono font-bold text-[var(--st-warning)]">
          {totalBountyDisplay}
        </div>
        <div data-st="meta" className="text-xs mt-1">
          Total bounty
        </div>

        {req.bounties && req.bounties.length > 0 && (
          <table data-st="grid" className="w-full text-xs mt-3">
            <thead data-st="colhead">
              <tr>
                <th className="pb-1">Contributor</th>
                <th className="pb-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {req.bounties.map((b) => (
                <tr key={b.id} data-st="row">
                  <td className="py-1">
                    {b.user ? (
                      <Link
                        to={`/private/user/${b.user.username}`}
                        data-st="control"
                      >
                        {b.user.username}
                      </Link>
                    ) : (
                      `User #${b.userId}`
                    )}
                  </td>
                  <td className="py-1 text-right font-mono" data-st-num>
                    <span className="text-[var(--st-warning)]">
                      {formatBytes(b.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {req.status === 'open' && user && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={bountyInput}
              onChange={(e) => setBountyInput(e.target.value)}
              placeholder="Bytes (e.g. 104857600)"
              data-st="field"
              className="flex-1 px-2 py-1 rounded text-sm"
            />
            <button
              onClick={handleAddBounty}
              disabled={addingBounty || !bountyInput}
              data-st="control"
              data-st-primary
              className="text-sm"
            >
              Add Bounty
            </button>
          </div>
        )}
      </div>

      {req.status === 'filled' && req.filledContributionId && (
        <div
          data-st="panel"
          className="rounded p-4 text-sm border-[var(--st-success)] bg-[color-mix(in_srgb,var(--st-success)_12%,transparent)]"
        >
          <div className="text-[var(--st-success)] font-medium mb-1">
            Filled
          </div>
          <div data-st="prose">
            Filled by{' '}
            {req.filler ? (
              <Link
                to={`/private/user/${req.filler.username}`}
                data-st="control"
              >
                {req.filler.username}
              </Link>
            ) : (
              'unknown user'
            )}
          </div>
        </div>
      )}

      {canFill && (
        <div data-st="panel" className="rounded p-4 space-y-2">
          <h3 data-st="prose" data-st-strong className="text-sm">
            Fill this request
          </h3>
          <p data-st="meta" className="text-xs">
            Enter the ID of your contribution that fulfills this request.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={fillContribId}
              onChange={(e) => setFillContribId(e.target.value)}
              placeholder="Contribution ID"
              data-st="field"
              className="w-40 px-2 py-1 rounded text-sm"
            />
            <button
              onClick={handleFill}
              disabled={filling || !fillContribId}
              data-st="control"
              data-st-primary
              data-st-success
              className="text-sm"
            >
              Fill Request
            </button>
          </div>
        </div>
      )}

      {canUnfill && (
        <div
          data-st="panel"
          className="rounded p-4 space-y-2 border-[var(--st-warning)]"
        >
          <h3 className="text-sm font-medium text-[var(--st-warning)]">
            Unfill (Staff)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={unfillReason}
              onChange={(e) => setUnfillReason(e.target.value)}
              placeholder="Reason (optional)"
              data-st="field"
              className="flex-1 px-2 py-1 rounded text-sm"
            />
            <button
              onClick={handleUnfill}
              disabled={unfilling}
              data-st="control"
              data-st-primary
              data-st-warning
              className="text-sm"
            >
              Unfill
            </button>
          </div>
        </div>
      )}

      {canDelete && (
        <div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            data-st="control"
            data-st-danger
            className="text-sm disabled:opacity-40"
          >
            Delete request
          </button>
        </div>
      )}

      {/* Bounty History */}
      <div data-st="panel" className="rounded overflow-hidden">
        <button
          onClick={() => setShowBountyHistory((v) => !v)}
          className="w-full px-4 py-2 text-left text-sm flex items-center justify-between text-[var(--st-text-muted)] hover:text-[var(--st-text)] transition-colors"
        >
          <span>Bounty History</span>
          <span>{showBountyHistory ? '▲' : '▼'}</span>
        </button>
        {showBountyHistory && (
          <div className="px-4 py-3">
            {bountyHistory && bountyHistory.length > 0 ? (
              <table data-st="grid" className="w-full text-xs">
                <thead data-st="colhead">
                  <tr>
                    <th className="pb-1">Contributor</th>
                    <th className="pb-1 text-right">Amount</th>
                    <th className="pb-1 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bountyHistory.map((entry) => (
                    <tr key={entry.id} data-st="row">
                      <td className="py-1">
                        {entry.user ? (
                          <Link
                            to={`/private/user/${entry.user.id}`}
                            data-st="control"
                          >
                            {entry.user.username}
                          </Link>
                        ) : (
                          'Anonymous'
                        )}
                      </td>
                      <td className="py-1 text-right font-mono" data-st-num>
                        <span className="text-[var(--st-warning)]">
                          {formatBytes(entry.amount)}
                        </span>
                      </td>
                      <td className="py-1 text-right">
                        <span data-st="meta">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p data-st="prose" data-st-muted className="text-sm">
                No bounty history.
              </p>
            )}
          </div>
        )}
      </div>

      <CommentsSection context="requests" pageId={requestId} />
    </div>
  );
};

function formatBytes(bytesStr?: string | null): string {
  const bytes = Number(bytesStr);
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${bytes} B`;
}

export default RequestDetailPage;
