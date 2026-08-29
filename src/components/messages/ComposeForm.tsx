import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useComposeMessageMutation,
  useCreateDraftMutation,
  useUpdateDraftMutation,
  useGetDraftsQuery,
  type MessageDraft
} from '../../store/services/messagesApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';

const ComposeForm = ({
  draftId,
  draft,
  toSeed
}: {
  draftId: number | null;
  draft?: MessageDraft;
  toSeed: string;
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Seeded from the draft if one loaded, otherwise from the ?to= param. The
  // caller keys on the draft's id, so a late-arriving draft remounts the form.
  const [toUsername, setToUsername] = useState(
    draft?.toUser?.username ?? toSeed
  );
  const [subject, setSubject] = useState(
    draft && draft.subject !== '(no subject)' ? draft.subject : ''
  );
  const [body, setBody] = useState(draft?.body ?? '');

  const [compose, { isLoading }] = useComposeMessageMutation();
  const [createDraft, { isLoading: isSavingDraft }] = useCreateDraftMutation();
  const [updateDraft] = useUpdateDraftMutation();

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

const ComposePage = () => {
  const [params] = useSearchParams();
  const draftId = params.get('draft') ? Number(params.get('draft')) : null;

  const { data: drafts } = useGetDraftsQuery(undefined, { skip: !draftId });
  const draft = draftId ? drafts?.find((d) => d.id === draftId) : undefined;

  return (
    <ComposeForm
      key={draft?.id ?? 'new'}
      draftId={draftId}
      draft={draft}
      // `to` query param accepts a username (not a numeric userId)
      toSeed={params.get('to') ?? ''}
    />
  );
};

export default ComposePage;
