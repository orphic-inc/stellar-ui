import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTicketQueueQuery,
  useBulkResolveTicketsMutation
} from '../../store/services/staffInboxApi';
import Spinner from '../layout/Spinner';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Unanswered', label: 'Unanswered' },
  { value: 'Open', label: 'Open' },
  { value: 'Resolved', label: 'Resolved' }
];

const STATUS_TONE: Record<string, BadgeVariant> = {
  Unanswered: 'warning',
  Open: 'info',
  Resolved: 'default'
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
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load ticket queue.
      </div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Ticket Queue
        </h2>
        <Link
          to="/private/staff/inbox/responses"
          data-st="control"
          className="px-3 py-1 rounded border border-[var(--st-border)] text-sm"
        >
          Canned Responses
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" data-st="meta">
            Status:
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            data-st="field"
            className="px-2 py-1"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <label
          data-st="meta"
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => {
              setAssignedToMe(e.target.checked);
              if (e.target.checked) setUnassigned(false);
              setPage(1);
            }}
            data-st="field"
          />
          Assigned to me
        </label>
        <label
          data-st="meta"
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={unassigned}
            onChange={(e) => {
              setUnassigned(e.target.checked);
              if (e.target.checked) setAssignedToMe(false);
              setPage(1);
            }}
            data-st="field"
          />
          Unassigned only
        </label>
      </div>

      {selected.length > 0 && (
        <div
          data-st="panel"
          className="flex gap-3 items-center mb-3 p-2 text-sm"
        >
          <span data-st="meta">{selected.length} selected</span>
          <button onClick={handleBulkResolve} data-st="control">
            Resolve all
          </button>
        </div>
      )}

      {tickets.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          No tickets match this filter.
        </p>
      ) : (
        <table data-st="grid" className="w-full text-sm">
          <thead data-st="colhead">
            <tr>
              <th className="pb-2 pr-3 w-6">
                <input
                  type="checkbox"
                  checked={
                    selected.length === tickets.length && tickets.length > 0
                  }
                  onChange={toggleAll}
                  data-st="field"
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
              return (
                <tr key={ticket.id} data-st="row">
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(ticket.id)}
                      onChange={() => toggleSelect(ticket.id)}
                      data-st="field"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1">
                      {ticket.status === 'Unanswered' && (
                        <span
                          className="text-xs text-[var(--st-warning)]"
                          aria-label="Unread"
                        >
                          ●
                        </span>
                      )}
                      <Link
                        to={`/private/staff/tickets/${ticket.id}`}
                        data-st="control"
                      >
                        {ticket.subject}
                      </Link>
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <span data-st="meta">{ticket.user?.username ?? '—'}</span>
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
                  <td className="py-2 text-xs whitespace-nowrap">
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

export default TicketQueuePage;
