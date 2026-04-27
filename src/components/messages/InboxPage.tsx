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
    return <div className="p-4 text-red-400">Failed to load inbox.</div>;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Inbox</h2>
        <div className="flex gap-2">
          <Link
            to="/private/messages/new"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
          >
            Compose
          </Link>
          <Link
            to="/private/messages/sent"
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Sent
          </Link>
          <Link
            to="/private/messages/tickets"
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Support
          </Link>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex gap-2 mb-3 p-2 bg-gray-800 rounded text-sm">
          <span className="text-gray-400">{selected.length} selected</span>
          <button
            onClick={() => handleBulk('markRead')}
            className="text-blue-400 hover:text-blue-300"
          >
            Mark read
          </button>
          <button
            onClick={() => handleBulk('markUnread')}
            className="text-blue-400 hover:text-blue-300"
          >
            Mark unread
          </button>
          <button
            onClick={() => handleBulk('delete')}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      )}

      {conversations.length === 0 ? (
        <p className="text-gray-500 text-sm">Your inbox is empty.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-3 w-6">
                <input
                  type="checkbox"
                  checked={
                    selected.length === conversations.length &&
                    conversations.length > 0
                  }
                  onChange={toggleAll}
                  className="accent-blue-500"
                />
              </th>
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">From</th>
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
                  className={`border-b border-gray-800 ${
                    isUnread ? 'font-semibold' : ''
                  }`}
                >
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(conv.id)}
                      onChange={() => toggleSelect(conv.id)}
                      className="accent-blue-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Link
                      to={`/private/messages/${conv.id}`}
                      className="hover:underline text-blue-400"
                    >
                      {userPart?.isSticky && (
                        <span className="mr-1 text-yellow-400 text-xs">★</span>
                      )}
                      {conv.subject}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-gray-300">
                    {lastMsg?.sender?.username ?? 'System'}
                  </td>
                  <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                    {userPart?.receivedAt
                      ? new Date(userPart.receivedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      className="text-gray-600 hover:text-red-400 text-xs"
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
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
