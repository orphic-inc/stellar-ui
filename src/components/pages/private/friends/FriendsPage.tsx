import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetMyFriendsQuery,
  useGetFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useRemoveFriendMutation,
  useUpdateFriendCommentMutation
} from '../../../../store/services/friendApi';
import { addAlert } from '../../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../../utils/apiError';
import Spinner from '../../../layout/Spinner';

const FriendsPage = () => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [editingComment, setEditingComment] = useState<Record<number, string>>(
    {}
  );

  const { data, isLoading, error } = useGetMyFriendsQuery(page);
  const { data: requests } = useGetFriendRequestsQuery(1);
  const [acceptRequest] = useAcceptFriendRequestMutation();
  const [rejectRequest] = useRejectFriendRequestMutation();
  const [removeFriend] = useRemoveFriendMutation();
  const [updateComment] = useUpdateFriendCommentMutation();

  const totalPages = data?.meta.totalPages ?? 1;
  const pendingRequests = requests?.data ?? [];

  const handleAccept = async (userId: number, username: string) => {
    try {
      await acceptRequest(userId).unwrap();
      dispatch(addAlert(`You and ${username} are now friends.`, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to accept request.',
          'danger'
        )
      );
    }
  };

  const handleReject = async (userId: number, username: string) => {
    try {
      await rejectRequest(userId).unwrap();
      dispatch(addAlert(`Request from ${username} rejected.`, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to reject request.',
          'danger'
        )
      );
    }
  };

  const handleRemove = async (userId: number, username: string) => {
    if (!window.confirm(`Remove ${username} from your friends list?`)) return;
    try {
      await removeFriend(userId).unwrap();
      dispatch(addAlert(`${username} removed from friends.`, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to remove friend.',
          'danger'
        )
      );
    }
  };

  const handleCommentUpdate = async (userId: number) => {
    const comment = editingComment[userId] ?? '';
    try {
      await updateComment({ userId, comment }).unwrap();
      dispatch(addAlert('Note updated.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to update note.', 'danger')
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <p data-st="prose" className="p-6 text-sm text-[var(--st-danger)]">
        Failed to load friends list.
      </p>
    );

  return (
    <div className="space-y-4">
      {pendingRequests.length > 0 && (
        <div
          data-st="panel"
          className="rounded border-[var(--st-accent)] bg-[color-mix(in_srgb,var(--st-accent)_10%,transparent)]"
        >
          <h2 data-st="colhead">Friend requests ({pendingRequests.length})</h2>
          <ul data-st="list">
            {pendingRequests.map((request) => (
              <li key={request.id} data-st="row" className="justify-between">
                <Link
                  to={`/user/${request.requester.id}`}
                  data-st="control"
                  className="font-medium"
                >
                  {request.requester.username}
                </Link>
                <div className="flex gap-2 whitespace-nowrap text-sm">
                  <button
                    onClick={() =>
                      handleAccept(
                        request.requester.id,
                        request.requester.username
                      )
                    }
                    data-st="control"
                    data-st-primary
                    data-st-success
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      handleReject(
                        request.requester.id,
                        request.requester.username
                      )
                    }
                    data-st="control"
                    data-st-primary
                    data-st-danger
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h1 data-st="prose" data-st-strong className="text-xl">
        Friends
      </h1>

      {!data || data.data.length === 0 ? (
        <div data-st="panel" className="rounded px-6 py-10 text-center">
          <p data-st="prose" data-st-muted className="text-sm">
            You haven&apos;t added any friends yet.
          </p>
        </div>
      ) : (
        <div data-st="panel" className="rounded">
          <table data-st="grid" className="w-full text-sm">
            <thead data-st="colhead">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((entry) => {
                const { friend, comment } = entry;
                const draft =
                  editingComment[friend.id] !== undefined
                    ? editingComment[friend.id]
                    : comment;
                const isDirty = draft !== comment;

                return (
                  <tr key={friend.id} data-st="row">
                    <td className="px-4 py-3">
                      <Link
                        to={`/user/${friend.id}`}
                        data-st="control"
                        className="font-medium"
                      >
                        {friend.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={draft}
                        onChange={(e) =>
                          setEditingComment((prev) => ({
                            ...prev,
                            [friend.id]: e.target.value
                          }))
                        }
                        data-st="field"
                        className="w-full rounded text-sm px-2 py-1 resize-none"
                        placeholder="Private note…"
                      />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                      {isDirty && (
                        <button
                          onClick={() => handleCommentUpdate(friend.id)}
                          data-st="control"
                          className="text-sm"
                        >
                          Save
                        </button>
                      )}
                      <Link
                        to={`/messages/new?to=${friend.username}`}
                        data-st="control"
                        className="text-sm"
                      >
                        Message
                      </Link>
                      <button
                        onClick={() => handleRemove(friend.id, friend.username)}
                        data-st="control"
                        data-st-danger
                        className="text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            data-st="control"
            className="px-3 py-1 rounded border border-[var(--st-border)] disabled:opacity-40"
          >
            Previous
          </button>
          <span data-st="meta" className="px-3 py-1">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            data-st="control"
            className="px-3 py-1 rounded border border-[var(--st-border)] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
