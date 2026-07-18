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

  const handleSticky = () => {
    const myPart = conv?.participants?.find(
      (p) => p.userId === currentUser?.id
    );
    updateFlags({ id: convId, isSticky: !myPart?.isSticky });
  };

  const handleMarkUnread = () => updateFlags({ id: convId, isRead: false });

  const handleDelete = async () => {
    await deleteConv(convId);
    window.history.back();
  };

  if (isLoading) return <Spinner />;
  if (error || !conv)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Conversation not found.
      </div>
    );

  const myParticipant = conv.participants?.find(
    (p) => p.userId === currentUser?.id
  );
  const otherParticipants =
    conv.participants?.filter((p) => p.userId !== currentUser?.id) ?? [];

  return (
    <div className="thin">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <Link to="/messages" data-st="control" className="text-sm">
            ← Inbox
          </Link>
          <h2 data-st="prose" data-st-strong className="text-xl mt-1">
            {conv.subject}
          </h2>
          {otherParticipants.length > 0 && (
            <p data-st="meta" className="text-sm">
              With:{' '}
              {otherParticipants.map((p) =>
                p.user?.username ? (
                  <Link
                    key={p.userId}
                    to={`/user/${p.user.username}`}
                    data-st="control"
                  >
                    {p.user.username}
                  </Link>
                ) : (
                  <span key={p.userId}>{`User ${p.userId}`}</span>
                )
              )}
            </p>
          )}
        </div>

        <div className="flex gap-2 text-sm shrink-0">
          <button
            onClick={handleSticky}
            data-st="control"
            className={`px-2 py-1 rounded border ${
              myParticipant?.isSticky
                ? 'border-[var(--st-warning)] text-[var(--st-warning)]'
                : 'border-[var(--st-border)]'
            }`}
            title="Toggle sticky"
          >
            ★
          </button>
          <button
            onClick={handleMarkUnread}
            data-st="control"
            className="px-2 py-1 rounded border border-[var(--st-border)]"
            title="Mark unread"
          >
            Unread
          </button>
          <button
            onClick={handleDelete}
            data-st="control"
            className="px-2 py-1 rounded border border-[var(--st-border)] text-[var(--st-danger)]"
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
              data-st="panel"
              className={`p-3 ${isMine ? 'ml-8 opacity-90' : 'mr-8'}`}
            >
              <div className="flex items-center gap-2 mb-2 text-sm">
                {msg.sender ? (
                  <Link
                    to={`/user/${msg.sender.username}`}
                    data-st="control"
                    className="font-medium"
                  >
                    {msg.sender.username}
                  </Link>
                ) : (
                  <span data-st="meta" className="font-medium">
                    System
                  </span>
                )}
                <span data-st="meta" className="text-xs">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p data-st="prose" className="text-sm whitespace-pre-wrap">
                {msg.body}
              </p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleReply} className="flex flex-col gap-3">
        <label htmlFor="conv-reply" data-st="meta" className="text-sm">
          Reply
        </label>
        <textarea
          id="conv-reply"
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={5}
          required
          data-st="field"
          className="w-full px-3 py-2 text-sm resize-y"
          placeholder="Write a reply…"
        />
        <button
          type="submit"
          disabled={replying}
          data-st="control"
          data-st-primary
          className="self-start text-sm"
        >
          {replying ? 'Sending…' : 'Send Reply'}
        </button>
      </form>
    </div>
  );
};

export default ConversationView;
