import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetSiteHistoryQuery,
  useCreateSiteHistoryMutation,
  useUpdateSiteHistoryMutation,
  useDeleteSiteHistoryMutation,
  type SiteHistoryEntry
} from '../../store/services/siteHistoryApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Button, Field, Modal } from '../ui';

interface EntryModalProps {
  entry?: SiteHistoryEntry;
  onClose: () => void;
}

const EntryModal = ({ entry, onClose }: EntryModalProps) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState(entry?.title ?? '');
  const [body, setBody] = useState(entry?.body ?? '');
  const [create, { isLoading: isCreating }] = useCreateSiteHistoryMutation();
  const [update, { isLoading: isUpdating }] = useUpdateSiteHistoryMutation();

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (entry) {
        await update({ id: entry.id, title, body }).unwrap();
        dispatch(addAlert('Entry updated.', 'success'));
      } else {
        await create({ title, body }).unwrap();
        dispatch(addAlert('Entry created.', 'success'));
      }
      onClose();
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to save.', 'danger')
      );
    }
  };

  return (
    <Modal
      title={entry ? 'Edit Entry' : 'New Entry'}
      onClose={onClose}
      dismissable={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          id="history-title"
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div>
          <label
            htmlFor="history-body"
            data-st="meta"
            className="block text-xs mb-1"
          >
            Body
          </label>
          <textarea
            id="history-body"
            data-st="field"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const SiteHistoryPage = () => {
  const dispatch = useDispatch();
  const { data: entries, isLoading, error } = useGetSiteHistoryQuery();
  const [deleteEntry] = useDeleteSiteHistoryMutation();
  const [modalEntry, setModalEntry] = useState<
    SiteHistoryEntry | null | undefined
  >(undefined);
  // undefined = closed, null = create new, SiteHistoryEntry = edit

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteEntry(id).unwrap();
      dispatch(addAlert('Entry deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete.', 'danger')
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load site history.
      </p>
    );

  return (
    <>
      {modalEntry !== undefined && (
        <EntryModal
          entry={modalEntry ?? undefined}
          onClose={() => setModalEntry(undefined)}
        />
      )}

      <PageShell
        title="Site History"
        width="md"
        actions={
          <Button variant="primary" onClick={() => setModalEntry(null)}>
            + Add Entry
          </Button>
        }
      >
        {!entries || entries.length === 0 ? (
          <Panel className="px-6 py-10 text-center">
            <p data-st="meta" className="text-sm">
              No site history entries.
            </p>
          </Panel>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Panel key={entry.id} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--st-border)]">
                  <span data-st="prose" data-st-strong className="text-sm">
                    {entry.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <span data-st="meta" className="text-xs">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    <Button variant="link" onClick={() => setModalEntry(entry)}>
                      Edit
                    </Button>
                    <Button
                      variant="link-danger"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div
                  data-st="prose"
                  className="px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
                >
                  {entry.body}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </PageShell>
    </>
  );
};

export default SiteHistoryPage;
