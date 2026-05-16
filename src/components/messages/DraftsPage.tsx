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
    return <div className="p-4 text-red-400">Failed to load drafts.</div>;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Drafts</h2>
        <div className="flex gap-2">
          <Link
            to="/private/messages/new"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
          >
            Compose
          </Link>
          <Link
            to="/private/messages"
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Inbox
          </Link>
        </div>
      </div>

      {!drafts || drafts.length === 0 ? (
        <p className="text-gray-500 text-sm">No saved drafts.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-3">Subject</th>
              <th className="pb-2 pr-3">To</th>
              <th className="pb-2">Last saved</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr
                key={draft.id}
                className="border-b border-gray-800 hover:bg-gray-800/20"
              >
                <td className="py-2 pr-3">
                  <Link
                    to={`/private/messages/new?draft=${draft.id}`}
                    className="hover:underline text-blue-400"
                  >
                    {draft.subject || '(no subject)'}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-gray-400">
                  {draft.toUser?.username ?? '—'}
                </td>
                <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(draft.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="text-gray-600 hover:text-red-400 text-xs"
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
