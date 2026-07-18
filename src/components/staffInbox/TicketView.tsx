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
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';
import { canUseTicketStaffActions } from '../staff/staffAffordances';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const STATUS_TONE: Record<string, BadgeVariant> = {
  Unanswered: 'warning',
  Open: 'info',
  Resolved: 'default'
};

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const canManageTicket = canUseTicketStaffActions(currentUser);

  const { data: ticket, isLoading, error } = useGetTicketQuery(ticketId);
  const { data: cannedResponses } = useGetCannedResponsesQuery(undefined, {
    skip: !canManageTicket
  });
  const [replyToTicket, { isLoading: replying }] = useReplyToTicketMutation();
  const [resolveTicket, { isLoading: resolving }] = useResolveTicketMutation();
  const [unresolveTicket] = useUnresolveTicketMutation();
  const [assignTicket] = useAssignTicketMutation();

  const [replyBody, setReplyBody] = useState('');
  const [selectedCanned, setSelectedCanned] = useState('');
  const [assignUsername, setAssignUsername] = useState('');

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

  const handleCannedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCanned(val);
    if (val) {
      const resp = cannedResponses?.find((r) => r.id === Number(val));
      if (resp) setReplyBody(resp.body);
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
    try {
      if (assignUsername.trim()) {
        await assignTicket({
          id: ticketId,
          assignedUsername: assignUsername.trim()
        }).unwrap();
      } else {
        await assignTicket({ id: ticketId, assignedUserId: null }).unwrap();
      }
      setAssignUsername('');
      dispatch(addAlert('Ticket assigned.', 'success'));
    } catch {
      dispatch(addAlert('Failed to assign ticket.', 'danger'));
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !ticket)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Ticket not found.
      </div>
    );

  const isResolved = ticket.status === 'Resolved';
  const isOwner = ticket.user?.id === currentUser?.id;
  // Staff Inbox is one namespace; only the label reflects which view the
  // staffer came from (the shared queue vs. their own tickets).
  const backLink = '/inbox/staff';
  const backLabel = canManageTicket ? '← Ticket Queue' : '← My Tickets';

  return (
    <div className="thin">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <Link to={backLink} data-st="control" className="text-sm">
            {backLabel}
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h2 data-st="prose" data-st-strong className="text-xl">
              {ticket.subject}
            </h2>
            <Badge variant={STATUS_TONE[ticket.status] ?? 'default'}>
              {ticket.status}
            </Badge>
          </div>
          {canManageTicket && (
            <p data-st="meta" className="text-sm mt-0.5">
              From:{' '}
              <Link to={`/user/${ticket.user?.username}`} data-st="control">
                {ticket.user?.username}
              </Link>
            </p>
          )}
          {ticket.assignedUser && (
            <p data-st="meta" className="text-sm mt-0.5">
              Assigned to:{' '}
              <span data-st="prose" data-st-strong>
                {ticket.assignedUser.username}
              </span>
            </p>
          )}
        </div>

        <div className="flex gap-2 text-sm shrink-0">
          {!isResolved && (canManageTicket || isOwner) && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              data-st="control"
              data-st-primary
              data-st-success
            >
              Resolve
            </button>
          )}
          {isResolved && canManageTicket && (
            <button
              onClick={handleUnresolve}
              data-st="control"
              className="px-3 py-1.5 rounded border border-[var(--st-border)]"
            >
              Unresolve
            </button>
          )}
        </div>
      </div>

      {canManageTicket && (
        <form
          onSubmit={handleAssign}
          data-st="panel"
          className="flex gap-2 mb-6 p-3 text-sm"
        >
          <label
            htmlFor="assign-user"
            data-st="meta"
            className="self-center whitespace-nowrap"
          >
            Assign to:
          </label>
          <input
            id="assign-user"
            type="text"
            value={assignUsername}
            onChange={(e) => setAssignUsername(e.target.value)}
            placeholder="Staff username (blank to unassign)"
            data-st="field"
            className="flex-1 px-2 py-1"
          />
          <button type="submit" data-st="control" data-st-primary>
            Assign
          </button>
        </form>
      )}

      <div className="space-y-4 mb-6">
        {(ticket.messages ?? []).map((msg) => {
          const isStaffMsg = msg.sender?.id !== ticket.user?.id;
          return (
            <div
              key={msg.id}
              data-st="panel"
              className={`p-3 ${isStaffMsg ? 'ml-4' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2 text-sm">
                {msg.sender ? (
                  <Link
                    to={`/user/${msg.sender.username}`}
                    data-st="control"
                    className="font-medium"
                  >
                    {msg.sender.username}
                  </Link>
                ) : (
                  <span data-st="meta" className="font-medium">
                    System
                  </span>
                )}
                {isStaffMsg && <Badge variant="info">Staff</Badge>}
                <span data-st="meta" className="text-xs">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p data-st="prose" className="text-sm whitespace-pre-wrap">
                {msg.body}
              </p>
            </div>
          );
        })}
      </div>

      {!isResolved && (
        <form onSubmit={handleReply} className="flex flex-col gap-3">
          {canManageTicket && cannedResponses && cannedResponses.length > 0 && (
            <div>
              <label
                htmlFor="canned-select"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Use canned response
              </label>
              <select
                id="canned-select"
                value={selectedCanned}
                onChange={handleCannedSelect}
                data-st="field"
                className="w-full px-3 py-2 text-sm"
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
          <label htmlFor="ticket-reply" data-st="meta" className="text-sm">
            Reply
          </label>
          <textarea
            id="ticket-reply"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={5}
            required
            data-st="field"
            className="w-full px-3 py-2 text-sm resize-y"
            placeholder="Write a reply…"
          />
          <button
            type="submit"
            disabled={replying}
            data-st="control"
            data-st-primary
            className="self-start text-sm"
          >
            {replying ? 'Sending…' : 'Send Reply'}
          </button>
        </form>
      )}
    </div>
  );
};

export default TicketView;
