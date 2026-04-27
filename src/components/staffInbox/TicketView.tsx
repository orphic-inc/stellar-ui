import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetTicketQuery,
  useReplyToTicketMutation,
  useResolveTicketMutation,
  useUnresolveTicketMutation,
  useAssignTicketMutation,
  useGetCannedResponsesQuery
} from '../../store/services/staffInboxApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { hasAnyPermission } from '../../utils/permissions';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';

const STATUS_BADGE: Record<string, string> = {
  Unanswered: 'bg-yellow-800 text-yellow-200',
  Open: 'bg-blue-800 text-blue-200',
  Resolved: 'bg-gray-700 text-gray-400'
};

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isStaff = hasAnyPermission(currentUser, ['staff', 'admin']);

  const { data: ticket, isLoading, error } = useGetTicketQuery(ticketId);
  const { data: cannedResponses } = useGetCannedResponsesQuery(undefined, {
    skip: !isStaff
  });
  const [replyToTicket, { isLoading: replying }] = useReplyToTicketMutation();
  const [resolveTicket, { isLoading: resolving }] = useResolveTicketMutation();
  const [unresolveTicket] = useUnresolveTicketMutation();
  const [assignTicket] = useAssignTicketMutation();

  const [replyBody, setReplyBody] = useState('');
  const [selectedCanned, setSelectedCanned] = useState('');
  const [assignUserId, setAssignUserId] = useState('');

  const handleCannedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCanned(val);
    if (val) {
      const resp = cannedResponses?.find((r) => r.id === Number(val));
      if (resp) setReplyBody(resp.body);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    try {
      await replyToTicket({ id: ticketId, body: replyBody }).unwrap();
      setReplyBody('');
      setSelectedCanned('');
    } catch {
      dispatch(addAlert('Failed to send reply.', 'danger'));
    }
  };

  const handleResolve = async () => {
    try {
      await resolveTicket(ticketId).unwrap();
    } catch {
      dispatch(addAlert('Failed to resolve ticket.', 'danger'));
    }
  };

  const handleUnresolve = async () => {
    try {
      await unresolveTicket(ticketId).unwrap();
    } catch {
      dispatch(addAlert('Failed to unresolve ticket.', 'danger'));
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = assignUserId ? parseInt(assignUserId, 10) : null;
    try {
      await assignTicket({ id: ticketId, assignedUserId: parsed }).unwrap();
      setAssignUserId('');
      dispatch(addAlert('Ticket assigned.', 'success'));
    } catch {
      dispatch(addAlert('Failed to assign ticket.', 'danger'));
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !ticket)
    return (
      <div className="p-4 text-red-400">Ticket not found or access denied.</div>
    );

  const isResolved = ticket.status === 'Resolved';
  const isOwner = ticket.user.id === currentUser?.id;

  const backLink = isStaff ? '/private/staff/inbox' : '/private/tickets/mine';

  return (
    <div className="thin">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <Link to={backLink} className="text-blue-400 text-sm hover:underline">
            ← {isStaff ? 'Staff Inbox' : 'My Tickets'}
          </Link>
          <h2 className="text-xl font-semibold mt-1">{ticket.subject}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span>
              From:{' '}
              <span className="text-gray-200">{ticket.user.username}</span>
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                STATUS_BADGE[ticket.status] ?? 'bg-gray-700 text-gray-400'
              }`}
            >
              {ticket.status}
            </span>
            {ticket.assignedUser && (
              <span>
                Assigned to:{' '}
                <span className="text-gray-200">
                  {ticket.assignedUser.username}
                </span>
              </span>
            )}
            {ticket.resolver && (
              <span>
                Resolved by:{' '}
                <span className="text-gray-200">
                  {ticket.resolver.username}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 text-sm shrink-0">
          {!isResolved && (isStaff || isOwner) && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-3 py-1.5 bg-green-800 hover:bg-green-700 text-white rounded disabled:opacity-50"
            >
              Resolve
            </button>
          )}
          {isResolved && isStaff && (
            <button
              onClick={handleUnresolve}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Unresolve
            </button>
          )}
        </div>
      </div>

      {isStaff && (
        <form
          onSubmit={handleAssign}
          className="flex gap-2 mb-6 p-3 bg-gray-800 rounded text-sm"
        >
          <label
            htmlFor="assign-user"
            className="self-center text-gray-400 whitespace-nowrap"
          >
            Assign to user ID:
          </label>
          <input
            id="assign-user"
            type="number"
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            placeholder="User ID (blank to unassign)"
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded"
          >
            Assign
          </button>
        </form>
      )}

      <div className="space-y-4 mb-6">
        {(ticket.messages ?? []).map((msg) => {
          const isMine = msg.sender.id === currentUser?.id;
          const isStaffMsg = msg.sender.id !== ticket.user.id;
          return (
            <div
              key={msg.id}
              className={`rounded p-3 border ${
                isStaffMsg
                  ? 'bg-gray-800 border-blue-900 ml-4'
                  : 'bg-gray-900 border-gray-700'
              } ${isMine ? 'opacity-90' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2 text-sm">
                <span className="font-medium text-blue-400">
                  {msg.sender.username}
                </span>
                {isStaffMsg && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-900 text-blue-300 rounded">
                    Staff
                  </span>
                )}
                <span className="text-gray-600 text-xs">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-200 text-sm whitespace-pre-wrap">
                {msg.body}
              </p>
            </div>
          );
        })}
      </div>

      {!isResolved && (
        <form onSubmit={handleReply} className="flex flex-col gap-3">
          {isStaff && cannedResponses && cannedResponses.length > 0 && (
            <div>
              <label
                htmlFor="canned-select"
                className="block text-sm text-gray-400 mb-1"
              >
                Use canned response
              </label>
              <select
                id="canned-select"
                value={selectedCanned}
                onChange={handleCannedSelect}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">— Select a template —</option>
                {cannedResponses.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label
              htmlFor="ticket-reply"
              className="block text-sm text-gray-400 mb-1"
            >
              Reply
            </label>
            <textarea
              id="ticket-reply"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              required
              rows={5}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
              placeholder="Write a reply…"
            />
          </div>
          <button
            type="submit"
            disabled={replying}
            className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
          >
            {replying ? 'Sending…' : 'Send Reply'}
          </button>
        </form>
      )}
    </div>
  );
};

export default TicketView;
