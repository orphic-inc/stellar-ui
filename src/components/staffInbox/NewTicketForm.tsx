import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTicketMutation } from '../../store/services/messagesApi';
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
      navigate(`/private/messages/${ticket.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { msg?: string } })?.data?.msg ??
        'Failed to create ticket.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  return (
    <div className="thin">
      <h2 className="text-xl font-semibold mb-4">Contact Staff</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="ticket-subject"
            className="block text-sm text-gray-400 mb-1"
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
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            placeholder="Brief description of your issue"
          />
        </div>
        <div>
          <label
            htmlFor="ticket-body"
            className="block text-sm text-gray-400 mb-1"
          >
            Message
          </label>
          <textarea
            id="ticket-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
            placeholder="Describe your issue in detail…"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
          >
            {isLoading ? 'Submitting…' : 'Submit Ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/private/messages/tickets')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTicketForm;
