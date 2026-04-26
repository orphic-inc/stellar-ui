import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSentboxQuery } from '../../store/services/messagesApi';
import Spinner from '../layout/Spinner';

const SentboxPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetSentboxQuery({ page });

  const conversations = data?.conversations ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div className="p-4 text-red-400">Failed to load sent messages.</div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Sent</h2>
        <div className="flex gap-2">
          <Link
            to="/private/messages/new"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
          >
            Compose
          </Link>
          <Link
            to="/private/messages"
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Inbox
          </Link>
        </div>
      </div>

      {conversations.length === 0 ? (
        <p className="text-gray-500 text-sm">No sent messages.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">Last message</th>
              <th className="pb-2">Sent</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conv) => {
              const userPart = conv.participants?.[0];
              const lastMsg = conv.messages?.[0];
              return (
                <tr key={conv.id} className="border-b border-gray-800">
                  <td className="py-2 pr-3">
                    <Link
                      to={`/private/messages/${conv.id}`}
                      className="hover:underline text-blue-400"
                    >
                      {conv.subject}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-gray-400 max-w-xs truncate">
                    {lastMsg?.body.slice(0, 80) ?? '—'}
                  </td>
                  <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                    {userPart?.sentAt
                      ? new Date(userPart.sentAt).toLocaleDateString()
                      : '—'}
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

export default SentboxPage;
