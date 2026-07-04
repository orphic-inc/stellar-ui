import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTicketMutation } from '../../store/services/staffInboxApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';

const NewTicketForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ticket = await createTicket({ subject, body }).unwrap();
      navigate(`/private/inbox/staff/${ticket.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { msg?: string } })?.data?.msg ??
        'Failed to create ticket.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  return (
    <div className="thin">
      <h2 data-st="prose" data-st-strong className="text-xl mb-4">
        Contact Staff
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="ticket-subject"
            data-st="meta"
            className="block text-sm mb-1"
          >
            Subject
          </label>
          <input
            id="ticket-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={255}
            data-st="field"
            className="w-full px-3 py-2 text-sm"
            placeholder="Brief description of your issue"
          />
        </div>
        <div>
          <label
            htmlFor="ticket-body"
            data-st="meta"
            className="block text-sm mb-1"
          >
            Message
          </label>
          <textarea
            id="ticket-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            data-st="field"
            className="w-full px-3 py-2 text-sm resize-y"
            placeholder="Describe your issue in detail…"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            data-st="control"
            data-st-primary
            className="text-sm"
          >
            {isLoading ? 'Submitting…' : 'Submit Ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/private/inbox/staff')}
            data-st="control"
            className="px-4 py-2 rounded border border-[var(--st-border)] text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTicketForm;
