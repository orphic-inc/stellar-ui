import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetDraftsQuery,
  useDeleteDraftMutation
} from '../../store/services/messagesApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const DraftsPage = () => {
  const dispatch = useDispatch();
  const { data: drafts, isLoading, error } = useGetDraftsQuery();
  const [deleteDraft] = useDeleteDraftMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteDraft(id).unwrap();
      dispatch(addAlert('Draft deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete draft.', 'danger')
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load drafts.
      </div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Drafts
        </h2>
        <div className="flex gap-2 text-sm">
          <Link to="/private/messages/new" data-st="control" data-st-primary>
            Compose
          </Link>
          <Link
            to="/private/messages"
            data-st="control"
            className="px-3 py-1 rounded border border-[var(--st-border)]"
          >
            Inbox
          </Link>
        </div>
      </div>

      {!drafts || drafts.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          No saved drafts.
        </p>
      ) : (
        <table data-st="grid" className="w-full text-sm">
          <thead data-st="colhead">
            <tr>
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">To</th>
              <th className="pb-2">Last saved</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft.id} data-st="row">
                <td className="py-2 pr-3">
                  <Link
                    to={`/private/messages/new?draft=${draft.id}`}
                    data-st="control"
                  >
                    {draft.subject || '(no subject)'}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  <span data-st="meta">{draft.toUser?.username ?? '—'}</span>
                </td>
                <td className="py-2 text-xs whitespace-nowrap">
                  <span data-st="meta">
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(draft.id)}
                    data-st="control"
                    data-st-danger
                    className="text-xs"
                    title="Delete draft"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DraftsPage;
