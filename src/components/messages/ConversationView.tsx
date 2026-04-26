import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetConversationQuery,
  useReplyToConversationMutation,
  useUpdateConversationFlagsMutation,
  useDeleteConversationMutation
} from '../../store/services/messagesApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';

const ConversationView = () => {
  const { id } = useParams<{ id: string }>();
  const convId = Number(id);
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const { data: conv, isLoading, error } = useGetConversationQuery(convId);
  const [reply, { isLoading: replying }] = useReplyToConversationMutation();
  const [updateFlags] = useUpdateConversationFlagsMutation();
  const [deleteConv] = useDeleteConversationMutation();

  const [replyBody, setReplyBody] = useState('');

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    try {
      await reply({ id: convId, body: replyBody }).unwrap();
      setReplyBody('');
    } catch {
      dispatch(addAlert('Failed to send reply.', 'danger'));
    }
  };

  const handleSticky = () =>
    updateFlags({
      id: convId,
      isSticky: !conv?.participants?.find((p) => p.userId === currentUser?.id)
        ?.isSticky
    });

  const handleMarkUnread = () => updateFlags({ id: convId, isRead: false });

  const handleDelete = async () => {
    await deleteConv(convId);
    window.history.back();
  };

  if (isLoading) return <Spinner />;
  if (error || !conv)
    return <div className="p-4 text-red-400">Conversation not found.</div>;

  const myParticipant = conv.participants?.find(
    (p) => p.userId === currentUser?.id
  );
  const otherParticipants =
    conv.participants?.filter((p) => p.userId !== currentUser?.id) ?? [];

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link
            to="/private/messages"
            className="text-blue-400 text-sm hover:underline"
          >
            ← Inbox
          </Link>
          <h2 className="text-xl font-semibold mt-1">{conv.subject}</h2>
          {otherParticipants.length > 0 && (
            <p className="text-sm text-gray-400">
              With:{' '}
              {otherParticipants.map((p) => (
                <Link
                  key={p.userId}
                  to={`/private/user/${p.userId}`}
                  className="text-blue-400 hover:underline"
                >
                  {p.user?.username ?? `User ${p.userId}`}
                </Link>
              ))}
            </p>
          )}
        </div>
        <div className="flex gap-2 text-sm">
          <button
            onClick={handleSticky}
            className={`px-2 py-1 rounded ${
              myParticipant?.isSticky
                ? 'bg-yellow-700 text-yellow-200'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle sticky"
          >
            ★
          </button>
          <button
            onClick={handleMarkUnread}
            className="px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            title="Mark unread"
          >
            Unread
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 rounded bg-gray-700 text-red-400 hover:bg-gray-600"
            title="Delete conversation"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {(conv.messages ?? []).map((msg) => {
          const isMine = msg.sender?.id === currentUser?.id;
          return (
            <div
              key={msg.id}
              className={`rounded p-3 ${
                isMine
                  ? 'bg-gray-800 ml-8'
                  : 'bg-gray-850 border border-gray-700 mr-8'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 text-sm">
                {msg.sender ? (
                  <Link
                    to={`/private/user/${msg.sender.id}`}
                    className="font-medium text-blue-400 hover:underline"
                  >
                    {msg.sender.username}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-400">System</span>
                )}
                <span className="text-gray-600 text-xs">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-200 text-sm whitespace-pre-wrap">
                {msg.body}
              </p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleReply} className="flex flex-col gap-3">
        <label htmlFor="conv-reply" className="text-sm text-gray-400">
          Reply
        </label>
        <textarea
          id="conv-reply"
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={5}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
          placeholder="Write a reply…"
        />
        <button
          type="submit"
          disabled={replying}
          className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
        >
          {replying ? 'Sending…' : 'Send Reply'}
        </button>
      </form>
    </div>
  );
};

export default ConversationView;
