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
import type { paths } from '../../types/api';

type CannedResponse =
  paths['/staff-inbox/responses']['get']['responses'][200]['content']['application/json'][number];

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
        <h2 data-st="prose" data-st-strong className="text-xl">
          Canned Responses
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          data-st="control"
          data-st-primary
          className="text-sm"
        >
          {showForm ? 'Cancel' : 'New Response'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          data-st="panel"
          className="mb-6 p-4 flex flex-col gap-3"
        >
          <h3 data-st="prose" data-st-strong className="text-sm">
            New Canned Response
          </h3>
          <div>
            <label
              htmlFor="new-resp-name"
              data-st="meta"
              className="block text-xs mb-1"
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
              data-st="field"
              className="w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="new-resp-body"
              data-st="meta"
              className="block text-xs mb-1"
            >
              Body
            </label>
            <textarea
              id="new-resp-body"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              required
              rows={4}
              data-st="field"
              className="w-full px-3 py-2 text-sm resize-y"
            />
          </div>
          <button
            type="submit"
            data-st="control"
            data-st-primary
            className="self-start text-sm"
          >
            Create
          </button>
        </form>
      )}

      {(responses ?? []).length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          No canned responses yet.
        </p>
      ) : (
        <div className="space-y-4">
          {(responses ?? []).map((resp) =>
            editing?.id === resp.id ? (
              <form
                key={resp.id}
                onSubmit={handleUpdate}
                data-st="panel"
                className="p-4 flex flex-col gap-3"
              >
                <div>
                  <label
                    htmlFor={`edit-name-${resp.id}`}
                    data-st="meta"
                    className="block text-xs mb-1"
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
                    data-st="field"
                    className="w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`edit-body-${resp.id}`}
                    data-st="meta"
                    className="block text-xs mb-1"
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
                    data-st="field"
                    className="w-full px-3 py-2 text-sm resize-y"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    data-st="control"
                    data-st-primary
                    className="text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    data-st="control"
                    className="px-4 py-2 rounded border border-[var(--st-border)] text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={resp.id} data-st="panel" className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span data-st="prose" data-st-strong className="font-medium">
                    {resp.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(resp)}
                      data-st="control"
                      className="text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(resp.id)}
                      data-st="control"
                      data-st-danger
                      className="text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p data-st="prose" className="text-sm whitespace-pre-wrap">
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
