import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetMyFriendsQuery,
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
  const [removeFriend] = useRemoveFriendMutation();
  const [updateComment] = useUpdateFriendCommentMutation();

  const totalPages = data?.meta.totalPages ?? 1;

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
      <p className="p-6 text-red-400 text-sm">Failed to load friends list.</p>
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Friends</h1>

      {!data || data.data.length === 0 ? (
        <div className="rounded border border-gray-700 bg-gray-900 px-6 py-10 text-center">
          <p className="text-gray-500 text-sm">
            You haven&apos;t added any friends yet.
          </p>
        </div>
      ) : (
        <div className="rounded border border-gray-700 bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.data.map((entry) => {
                const { friend, comment } = entry;
                const draft =
                  editingComment[friend.id] !== undefined
                    ? editingComment[friend.id]
                    : comment;
                const isDirty = draft !== comment;

                return (
                  <tr
                    key={friend.id}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/private/user/${friend.id}`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
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
                        className="w-full rounded bg-gray-700 border border-gray-600 text-white text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        placeholder="Private note…"
                      />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                      {isDirty && (
                        <button
                          onClick={() => handleCommentUpdate(friend.id)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                        >
                          Save
                        </button>
                      )}
                      <Link
                        to={`/private/messages/new?to=${friend.username}`}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Message
                      </Link>
                      <button
                        onClick={() => handleRemove(friend.id, friend.username)}
                        className="text-red-500 hover:text-red-400 text-sm transition-colors"
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
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
