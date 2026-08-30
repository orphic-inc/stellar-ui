import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSentboxQuery } from '../../store/services/messagesApi';
import Spinner from '../layout/Spinner';
import { Pagination } from '../ui';

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
          <Link to="/messages/new" data-st="control" data-st-primary>
            Compose
          </Link>
          <Link
            to="/messages"
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
                    <Link to={`/messages/${conv.id}`} data-st="control">
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

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

export default SentboxPage;
