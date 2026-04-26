import { useState } from 'react';
import {
  useGetCannedResponsesQuery,
  useCreateCannedResponseMutation,
  useUpdateCannedResponseMutation,
  useDeleteCannedResponseMutation
} from '../../store/services/staffInboxApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';

type CannedResponse = {
  id: number;
  name: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

const CannedResponsesPage = () => {
  const dispatch = useAppDispatch();
  const { data: responses, isLoading } = useGetCannedResponsesQuery();
  const [createResponse] = useCreateCannedResponseMutation();
  const [updateResponse] = useUpdateCannedResponseMutation();
  const [deleteResponse] = useDeleteCannedResponseMutation();

  const [editing, setEditing] = useState<CannedResponse | null>(null);
  const [newName, setNewName] = useState('');
  const [newBody, setNewBody] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createResponse({ name: newName, body: newBody }).unwrap();
      setNewName('');
      setNewBody('');
      setShowForm(false);
    } catch {
      dispatch(addAlert('Failed to create response.', 'danger'));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateResponse({
        id: editing.id,
        name: editing.name,
        body: editing.body
      }).unwrap();
      setEditing(null);
    } catch {
      dispatch(addAlert('Failed to update response.', 'danger'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this canned response?')) return;
    try {
      await deleteResponse(id).unwrap();
    } catch {
      dispatch(addAlert('Failed to delete response.', 'danger'));
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Canned Responses</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
        >
          {showForm ? 'Cancel' : 'New Response'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-gray-800 rounded flex flex-col gap-3"
        >
          <h3 className="text-sm font-semibold text-gray-300">
            New Canned Response
          </h3>
          <div>
            <label
              htmlFor="new-resp-name"
              className="block text-xs text-gray-400 mb-1"
            >
              Name
            </label>
            <input
              id="new-resp-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              maxLength={255}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="new-resp-body"
              className="block text-xs text-gray-400 mb-1"
            >
              Body
            </label>
            <textarea
              id="new-resp-body"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>
          <button
            type="submit"
            className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
          >
            Create
          </button>
        </form>
      )}

      {(responses ?? []).length === 0 ? (
        <p className="text-gray-500 text-sm">No canned responses yet.</p>
      ) : (
        <div className="space-y-4">
          {(responses ?? []).map((resp) =>
            editing?.id === resp.id ? (
              <form
                key={resp.id}
                onSubmit={handleUpdate}
                className="p-4 bg-gray-800 rounded flex flex-col gap-3"
              >
                <div>
                  <label
                    htmlFor={`edit-name-${resp.id}`}
                    className="block text-xs text-gray-400 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id={`edit-name-${resp.id}`}
                    type="text"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`edit-body-${resp.id}`}
                    className="block text-xs text-gray-400 mb-1"
                  >
                    Body
                  </label>
                  <textarea
                    id={`edit-body-${resp.id}`}
                    value={editing.body}
                    onChange={(e) =>
                      setEditing({ ...editing, body: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500 resize-y"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={resp.id} className="p-4 bg-gray-800 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-200">{resp.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(resp)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(resp.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm whitespace-pre-wrap">
                  {resp.body}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CannedResponsesPage;
