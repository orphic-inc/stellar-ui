import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useComposeMessageMutation,
  useCreateDraftMutation,
  useUpdateDraftMutation,
  useGetDraftsQuery
} from '../../store/services/messagesApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';

const ComposeForm = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dispatch = useAppDispatch();

  const draftId = params.get('draft') ? Number(params.get('draft')) : null;

  // `to` query param accepts a username (not a numeric userId)
  const [toUsername, setToUsername] = useState(params.get('to') ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [compose, { isLoading }] = useComposeMessageMutation();
  const [createDraft, { isLoading: isSavingDraft }] = useCreateDraftMutation();
  const [updateDraft] = useUpdateDraftMutation();

  const { data: drafts } = useGetDraftsQuery(undefined, { skip: !draftId });
  const draftToLoad = draftId ? drafts?.find((d) => d.id === draftId) : null;

  useEffect(() => {
    if (!draftToLoad) return;
    if (draftToLoad.toUser?.username)
      setToUsername(draftToLoad.toUser.username);
    setSubject(
      draftToLoad.subject === '(no subject)' ? '' : draftToLoad.subject
    );
    setBody(draftToLoad.body);
  }, [draftToLoad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUsername.trim()) {
      dispatch(addAlert('Recipient username is required.', 'danger'));
      return;
    }
    try {
      const conv = await compose({
        toUsername: toUsername.trim(),
        subject,
        body
      }).unwrap();
      navigate(`/messages/${conv.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { msg?: string } })?.data?.msg ??
        'Failed to send message.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  const handleSaveDraft = async () => {
    if (!subject && !body) {
      dispatch(addAlert('Nothing to save.', 'danger'));
      return;
    }
    try {
      if (draftId) {
        await updateDraft({
          id: draftId,
          toUsername: toUsername.trim() || undefined,
          subject: subject || '(no subject)',
          body
        }).unwrap();
      } else {
        await createDraft({
          toUsername: toUsername.trim() || undefined,
          subject: subject || '(no subject)',
          body
        }).unwrap();
      }
      dispatch(addAlert('Draft saved.', 'success'));
    } catch {
      dispatch(addAlert('Failed to save draft.', 'danger'));
    }
  };

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          New Message
        </h2>
        <a href="/messages/drafts" data-st="control" className="text-sm">
          View drafts
        </a>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="compose-to"
            data-st="meta"
            className="block text-sm mb-1"
          >
            To (username)
          </label>
          <input
            id="compose-to"
            type="text"
            value={toUsername}
            onChange={(e) => setToUsername(e.target.value)}
            required
            data-st="field"
            className="w-full px-3 py-2 text-sm"
            placeholder="Enter username"
          />
        </div>
        <div>
          <label
            htmlFor="compose-subject"
            data-st="meta"
            className="block text-sm mb-1"
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
            data-st="field"
            className="w-full px-3 py-2 text-sm"
            placeholder="Subject"
          />
        </div>
        <div>
          <label
            htmlFor="compose-body"
            data-st="meta"
            className="block text-sm mb-1"
          >
            Message
          </label>
          <textarea
            id="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            data-st="field"
            className="w-full px-3 py-2 text-sm resize-y"
            placeholder="Write your message…"
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
            {isLoading ? 'Sending…' : 'Send'}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            data-st="control"
            className="px-4 py-2 rounded border border-[var(--st-border)] text-sm disabled:opacity-50"
          >
            {isSavingDraft ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/messages')}
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

export default ComposeForm;
