import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useComposeMessageMutation } from '../../store/services/messagesApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';

const ComposeForm = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dispatch = useAppDispatch();

  const [toUserId, setToUserId] = useState(params.get('to') ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [compose, { isLoading }] = useComposeMessageMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(toUserId, 10);
    if (!parsedId || isNaN(parsedId)) {
      dispatch(addAlert('Recipient user ID is required.', 'danger'));
      return;
    }
    try {
      const conv = await compose({
        toUserId: parsedId,
        subject,
        body
      }).unwrap();
      navigate(`/private/messages/${conv.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { msg?: string } })?.data?.msg ??
        'Failed to send message.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  return (
    <div className="thin">
      <h2 className="text-xl font-semibold mb-4">New Message</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="compose-to"
            className="block text-sm text-gray-400 mb-1"
          >
            To (user ID)
          </label>
          <input
            id="compose-to"
            type="number"
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            placeholder="Enter user ID"
          />
        </div>
        <div>
          <label
            htmlFor="compose-subject"
            className="block text-sm text-gray-400 mb-1"
          >
            Subject
          </label>
          <input
            id="compose-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={255}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            placeholder="Subject"
          />
        </div>
        <div>
          <label
            htmlFor="compose-body"
            className="block text-sm text-gray-400 mb-1"
          >
            Message
          </label>
          <textarea
            id="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
            placeholder="Write your message…"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
          >
            {isLoading ? 'Sending…' : 'Send'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/private/messages')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComposeForm;
