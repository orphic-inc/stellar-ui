import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetRequestQuery,
  useAddBountyMutation,
  useFillRequestMutation,
  useUnfillRequestMutation,
  useDeleteRequestMutation
} from '../../store/services/requestApi';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import { addAlert } from '../../store/slices/alertSlice';
import { useAppDispatch } from '../../store/hooks';

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

  const [bountyInput, setBountyInput] = useState('');
  const [fillContribId, setFillContribId] = useState('');
  const [unfillReason, setUnfillReason] = useState('');

  const isStaff = hasAnyPermission(user, ['staff', 'admin']);
  const isOwner = user?.id === req?.userId;

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
    return <div className="p-4 text-red-400">Request not found.</div>;

  const totalBountyDisplay = formatBytes(req.totalBounty);
  const canDelete = (isOwner && req.status === 'open') || isStaff;
  const canFill = req.status === 'open' && !!user;
  const canUnfill = req.status === 'filled' && isStaff;

  return (
    <div className="thin space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{req.title}</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full shrink-0 ${
              req.status === 'filled'
                ? 'bg-green-900/40 text-green-400'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            {req.status}
          </span>
        </div>
        <div className="text-sm text-gray-400 mt-1 space-x-4">
          <span>Type: {req.type}</span>
          {req.year && <span>Year: {req.year}</span>}
          {req.community && <span>Community: {req.community.name}</span>}
          {req.user && (
            <span>
              By{' '}
              <Link
                to={`/private/user/${req.user.username}`}
                className="text-blue-400 hover:underline"
              >
                {req.user.username}
              </Link>
            </span>
          )}
        </div>
      </div>

      {req.description && (
        <p className="text-gray-300 text-sm whitespace-pre-wrap">
          {req.description}
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded p-4">
        <div className="text-2xl font-mono font-bold text-yellow-400">
          {totalBountyDisplay}
        </div>
        <div className="text-xs text-gray-500 mt-1">Total bounty</div>

        {req.bounties && req.bounties.length > 0 && (
          <table className="w-full text-xs mt-3">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-1">Contributor</th>
                <th className="pb-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {req.bounties.map((b) => (
                <tr key={b.id} className="border-t border-gray-800/50">
                  <td className="py-1">
                    {b.user ? (
                      <Link
                        to={`/private/user/${b.user.username}`}
                        className="text-blue-400 hover:underline"
                      >
                        {b.user.username}
                      </Link>
                    ) : (
                      `User #${b.userId}`
                    )}
                  </td>
                  <td className="py-1 text-right font-mono text-yellow-300">
                    {formatBytes(b.amount)}
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
              className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
            />
            <button
              onClick={handleAddBounty}
              disabled={addingBounty || !bountyInput}
              className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded disabled:opacity-40"
            >
              Add Bounty
            </button>
          </div>
        )}
      </div>

      {req.status === 'filled' && req.filledContributionId && (
        <div className="bg-green-950/30 border border-green-800/40 rounded p-4 text-sm">
          <div className="text-green-400 font-medium mb-1">Filled</div>
          <div className="text-gray-300">
            Filled by{' '}
            {req.filler ? (
              <Link
                to={`/private/user/${req.filler.username}`}
                className="text-blue-400 hover:underline"
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
        <div className="border border-gray-800 rounded p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-300">
            Fill this request
          </h3>
          <p className="text-xs text-gray-500">
            Enter the ID of your contribution that fulfills this request.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={fillContribId}
              onChange={(e) => setFillContribId(e.target.value)}
              placeholder="Contribution ID"
              className="w-40 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
            />
            <button
              onClick={handleFill}
              disabled={filling || !fillContribId}
              className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-sm rounded disabled:opacity-40"
            >
              Fill Request
            </button>
          </div>
        </div>
      )}

      {canUnfill && (
        <div className="border border-orange-800/40 rounded p-4 space-y-2">
          <h3 className="text-sm font-medium text-orange-300">
            Unfill (Staff)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={unfillReason}
              onChange={(e) => setUnfillReason(e.target.value)}
              placeholder="Reason (optional)"
              className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
            />
            <button
              onClick={handleUnfill}
              disabled={unfilling}
              className="px-3 py-1 bg-orange-800 hover:bg-orange-700 text-white text-sm rounded disabled:opacity-40"
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
            className="text-sm text-red-500 hover:text-red-400 disabled:opacity-40"
          >
            Delete request
          </button>
        </div>
      )}
    </div>
  );
};

function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr);
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${bytes} B`;
}

export default RequestDetailPage;
