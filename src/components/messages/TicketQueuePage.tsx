import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTicketQueueQuery,
  useBulkResolveTicketsMutation
} from '../../store/services/messagesApi';
import Spinner from '../layout/Spinner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Unanswered', label: 'Unanswered' },
  { value: 'Open', label: 'Open' },
  { value: 'Resolved', label: 'Resolved' }
];

const STATUS_BADGE: Record<string, string> = {
  Unanswered: 'bg-yellow-800 text-yellow-200',
  Open: 'bg-blue-800 text-blue-200',
  Resolved: 'bg-gray-700 text-gray-400'
};

const TicketQueuePage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [unassigned, setUnassigned] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const { data, isLoading, error } = useGetTicketQueueQuery({
    page,
    status,
    assignedToMe,
    unassigned
  });
  const [bulkResolve] = useBulkResolveTicketsMutation();

  const tickets = data?.conversations ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  const toggleSelect = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelected(
      selected.length === tickets.length ? [] : tickets.map((t) => t.id)
    );

  const handleBulkResolve = async () => {
    if (selected.length === 0) return;
    const result = await bulkResolve({ ids: selected }).unwrap();
    setSelected([]);
    alert(`Resolved ${result.resolved} ticket(s).`);
  };

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load ticket queue.</div>;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Ticket Queue</h2>
        <Link
          to="/private/staff/inbox/responses"
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
        >
          Canned Responses
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-gray-400">
            Status:
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => {
              setAssignedToMe(e.target.checked);
              if (e.target.checked) setUnassigned(false);
              setPage(1);
            }}
            className="accent-blue-500"
          />
          Assigned to me
        </label>
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={unassigned}
            onChange={(e) => {
              setUnassigned(e.target.checked);
              if (e.target.checked) setAssignedToMe(false);
              setPage(1);
            }}
            className="accent-blue-500"
          />
          Unassigned only
        </label>
      </div>

      {selected.length > 0 && (
        <div className="flex gap-3 mb-3 p-2 bg-gray-800 rounded text-sm">
          <span className="text-gray-400">{selected.length} selected</span>
          <button
            onClick={handleBulkResolve}
            className="text-green-400 hover:text-green-300"
          >
            Resolve all
          </button>
        </div>
      )}

      {tickets.length === 0 ? (
        <p className="text-gray-500 text-sm">No tickets match this filter.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-3 w-6">
                <input
                  type="checkbox"
                  checked={
                    selected.length === tickets.length && tickets.length > 0
                  }
                  onChange={toggleAll}
                  className="accent-blue-500"
                />
              </th>
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">From</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Assigned</th>
              <th className="pb-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const owner = ticket.participants?.[0]?.user;
              return (
                <tr key={ticket.id} className="border-b border-gray-800">
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(ticket.id)}
                      onChange={() => toggleSelect(ticket.id)}
                      className="accent-blue-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Link
                      to={`/private/messages/${ticket.id}`}
                      className="hover:underline text-blue-400"
                    >
                      {ticket.ticketStatus === 'Unanswered' && (
                        <span className="mr-1 text-yellow-400">●</span>
                      )}
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-gray-300">
                    {owner?.username ?? '—'}
                  </td>
                  <td className="py-2 pr-3">
                    {ticket.ticketStatus && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          STATUS_BADGE[ticket.ticketStatus] ??
                          'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {ticket.ticketStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-gray-400">
                    {ticket.assignedStaff?.username ?? '—'}
                  </td>
                  <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
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

export default TicketQueuePage;
