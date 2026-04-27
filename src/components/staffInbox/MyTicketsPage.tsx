import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyTicketsQuery } from '../../store/services/staffInboxApi';
import Spinner from '../layout/Spinner';

const STATUS_BADGE: Record<string, string> = {
  Unanswered: 'bg-yellow-800 text-yellow-200',
  Open: 'bg-blue-800 text-blue-200',
  Resolved: 'bg-gray-700 text-gray-400'
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
    return <div className="p-4 text-red-400">Failed to load tickets.</div>;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Support Tickets</h2>
        <Link
          to="/private/tickets/new"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
        >
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <p className="text-gray-500 text-sm">You have no support tickets.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Assigned</th>
              <th className="pb-2">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-800">
                <td className="py-2 pr-3">
                  <Link
                    to={`/private/tickets/${ticket.id}`}
                    className="hover:underline text-blue-400"
                  >
                    {!ticket.isReadByUser && ticket.status !== 'Unanswered' && (
                      <span className="mr-1 font-bold text-blue-300">●</span>
                    )}
                    {ticket.subject}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      STATUS_BADGE[ticket.status] ?? 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="py-2 pr-3 text-gray-400">
                  {ticket.assignedUser?.username ?? '—'}
                </td>
                <td className="py-2 text-gray-500 text-xs">
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
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

export default MyTicketsPage;
