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
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load sent messages.
      </div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Sent
        </h2>
        <div className="flex gap-2 text-sm">
          <Link to="/private/messages/new" data-st="control" data-st-primary>
            Compose
          </Link>
          <Link
            to="/private/messages"
            data-st="control"
            className="px-3 py-1 rounded border border-[var(--st-border)]"
          >
            Inbox
          </Link>
        </div>
      </div>

      {conversations.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          No sent messages.
        </p>
      ) : (
        <table data-st="grid" className="w-full text-sm">
          <thead data-st="colhead">
            <tr>
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
                <tr key={conv.id} data-st="row">
                  <td className="py-2 pr-3">
                    <Link to={`/private/messages/${conv.id}`} data-st="control">
                      {conv.subject}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 max-w-xs truncate">
                    <span data-st="meta">
                      {lastMsg?.body.slice(0, 80) ?? '—'}
                    </span>
                  </td>
                  <td className="py-2 text-xs whitespace-nowrap">
                    <span data-st="meta">
                      {userPart?.sentAt
                        ? new Date(userPart.sentAt).toLocaleDateString()
                        : '—'}
                    </span>
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

export default SentboxPage;
