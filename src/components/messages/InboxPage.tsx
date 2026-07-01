import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetInboxQuery,
  useDeleteConversationMutation,
  useBulkUpdateConversationsMutation
} from '../../store/services/messagesApi';
import Spinner from '../layout/Spinner';

const InboxPage = () => {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);

  const { data, isLoading, error } = useGetInboxQuery({ page });
  const [deleteConversation] = useDeleteConversationMutation();
  const [bulkUpdate] = useBulkUpdateConversationsMutation();

  const conversations = data?.conversations ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  const toggleSelect = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelected(
      selected.length === conversations.length
        ? []
        : conversations.map((c) => c.id)
    );

  const handleBulk = async (action: 'delete' | 'markRead' | 'markUnread') => {
    if (selected.length === 0) return;
    await bulkUpdate({ ids: selected, action });
    setSelected([]);
  };

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load inbox.
      </div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Inbox
        </h2>
        <div className="flex gap-2 text-sm">
          <Link to="/private/messages/new" data-st="control" data-st-primary>
            Compose
          </Link>
          <Link
            to="/private/messages/sent"
            data-st="control"
            className="px-3 py-1 rounded border border-[var(--st-border)]"
          >
            Sent
          </Link>
          <Link
            to="/private/messages/drafts"
            data-st="control"
            className="px-3 py-1 rounded border border-[var(--st-border)]"
          >
            Drafts
          </Link>
          <Link
            to="/private/messages/tickets"
            data-st="control"
            className="px-3 py-1 rounded border border-[var(--st-border)]"
          >
            Support
          </Link>
        </div>
      </div>

      {selected.length > 0 && (
        <div
          data-st="panel"
          className="flex gap-3 items-center mb-3 p-2 text-sm"
        >
          <span data-st="meta">{selected.length} selected</span>
          <button onClick={() => handleBulk('markRead')} data-st="control">
            Mark read
          </button>
          <button onClick={() => handleBulk('markUnread')} data-st="control">
            Mark unread
          </button>
          <button
            onClick={() => handleBulk('delete')}
            data-st="control"
            data-st-danger
          >
            Delete
          </button>
        </div>
      )}

      {conversations.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          Your inbox is empty.
        </p>
      ) : (
        <table data-st="grid" className="w-full text-sm">
          <thead data-st="colhead">
            <tr>
              <th className="pb-2 pr-3 w-6">
                <input
                  type="checkbox"
                  checked={
                    selected.length === conversations.length &&
                    conversations.length > 0
                  }
                  onChange={toggleAll}
                  data-st="field"
                />
              </th>
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">Last reply by</th>
              <th className="pb-2">Received</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conv) => {
              const userPart = conv.participants?.[0];
              const lastMsg = conv.messages?.[0];
              const isUnread = !userPart?.isRead;
              return (
                <tr
                  key={conv.id}
                  data-st="row"
                  className={isUnread ? 'font-semibold' : ''}
                >
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(conv.id)}
                      onChange={() => toggleSelect(conv.id)}
                      data-st="field"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Link to={`/private/messages/${conv.id}`} data-st="control">
                      {userPart?.isSticky && (
                        <span className="mr-1 text-xs text-[var(--st-warning)]">
                          ★
                        </span>
                      )}
                      {conv.subject}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    <span data-st="meta">
                      {lastMsg?.sender?.username ?? 'System'}
                    </span>
                  </td>
                  <td className="py-2 text-xs whitespace-nowrap">
                    <span data-st="meta">
                      {userPart?.receivedAt
                        ? new Date(userPart.receivedAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      data-st="control"
                      data-st-danger
                      className="text-xs"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default InboxPage;
