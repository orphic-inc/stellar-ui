import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyTicketsQuery } from '../../store/services/staffInboxApi';
import Spinner from '../layout/Spinner';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const STATUS_TONE: Record<string, BadgeVariant> = {
  Unanswered: 'warning',
  Open: 'info',
  Resolved: 'default'
};

const MyTicketsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetMyTicketsQuery({ page });

  const tickets = data?.conversations ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load tickets.
      </div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          My Support Tickets
        </h2>
        <Link to="/private/inbox/staff/new" data-st="control" data-st-primary>
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          You have no support tickets.
        </p>
      ) : (
        <table data-st="grid" className="w-full text-sm">
          <thead data-st="colhead">
            <tr>
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Assigned</th>
              <th className="pb-2">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              return (
                <tr key={ticket.id} data-st="row">
                  <td className="py-2 pr-3">
                    <Link
                      to={`/private/inbox/staff/${ticket.id}`}
                      data-st="control"
                    >
                      {!ticket.isReadByUser &&
                        ticket.status !== 'Unanswered' && (
                          <span className="mr-1 font-bold text-[var(--st-info)]">
                            ●
                          </span>
                        )}
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={STATUS_TONE[ticket.status] ?? 'default'}>
                      {ticket.status}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <span data-st="meta">
                      {ticket.assignedUser?.username ?? '—'}
                    </span>
                  </td>
                  <td className="py-2 text-xs">
                    <span data-st="meta">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
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

export default MyTicketsPage;
