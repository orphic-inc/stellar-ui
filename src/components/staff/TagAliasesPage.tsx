import { useState } from 'react';
import {
  useGetTagAliasesQuery,
  useCreateTagAliasMutation,
  useUpdateTagAliasMutation,
  useDeleteTagAliasMutation
} from '../../store/services/tagAliasApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import { PageShell, Panel, Button, Pagination } from '../ui';

const TagAliasesPage = () => {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBadTag, setEditBadTag] = useState('');
  const [editGoodTag, setEditGoodTag] = useState('');
  const [newBadTag, setNewBadTag] = useState('');
  const [newGoodTag, setNewGoodTag] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useGetTagAliasesQuery({ page });
  const [createTagAlias, { isLoading: creating }] = useCreateTagAliasMutation();
  const [updateTagAlias] = useUpdateTagAliasMutation();
  const [deleteTagAlias] = useDeleteTagAliasMutation();

  const aliases = data?.data ?? [];
  const meta = data?.meta;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await createTagAlias({
      badTag: newBadTag.trim(),
      goodTag: newGoodTag.trim()
    });
    if ('error' in result) {
      setError('Failed to create alias. Check that the canonical tag exists.');
    } else {
      setNewBadTag('');
      setNewGoodTag('');
    }
  };

  const startEdit = (id: number, badTag: string, goodTagName: string) => {
    setEditingId(id);
    setEditBadTag(badTag);
    setEditGoodTag(goodTagName);
  };

  const handleSaveEdit = async (id: number) => {
    await updateTagAlias({
      id,
      badTag: editBadTag.trim(),
      goodTag: editGoodTag.trim()
    });
    setEditingId(null);
  };

  return (
    <PageShell title="Tag Aliases" backTo="/private/staff/tools" width="lg">
      <p data-st="meta" className="text-sm">
        Maps misspelled or non-canonical tag names to the correct tag. Applied
        automatically on new submissions.
      </p>

      <Panel className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : (
          <table data-st="grid">
            <thead data-st="colhead">
              <tr>
                <th className="w-1/3">Bad tag (rename from)</th>
                <th className="w-1/3">Canonical tag (rename to)</th>
                <th>Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {aliases.length === 0 ? (
                <tr data-st="row">
                  <td colSpan={4} className="text-center">
                    No aliases defined.
                  </td>
                </tr>
              ) : (
                aliases.map((a) =>
                  editingId === a.id ? (
                    <tr key={a.id} data-st="row" data-st-open>
                      <td>
                        <input
                          data-st="field"
                          className="w-full"
                          value={editBadTag}
                          onChange={(e) => setEditBadTag(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          data-st="field"
                          className="w-full"
                          value={editGoodTag}
                          onChange={(e) => setEditGoodTag(e.target.value)}
                        />
                      </td>
                      <td>
                        <Time date={a.createdAt} />
                      </td>
                      <td className="text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(a.id)}
                          className="text-sm text-[var(--st-success)] transition-colors"
                        >
                          Save
                        </button>
                        <Button
                          variant="link"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={a.id} data-st="row">
                      <td>
                        <span className="font-mono text-[var(--st-danger)]">
                          {a.badTag}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-[var(--st-success)]">
                          {a.goodTag.name}
                        </span>
                      </td>
                      <td>
                        <Time date={a.createdAt} />
                      </td>
                      <td className="text-right space-x-3">
                        <Button
                          variant="link"
                          onClick={() =>
                            startEdit(a.id, a.badTag, a.goodTag.name)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="link-danger"
                          onClick={() => deleteTagAlias(a.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )
                )
              )}

              {/* Create row */}
              <tr data-st="row">
                <td>
                  <input
                    data-st="field"
                    className="w-full"
                    placeholder="e.g. hip-hop"
                    value={newBadTag}
                    onChange={(e) => setNewBadTag(e.target.value)}
                  />
                </td>
                <td>
                  <input
                    data-st="field"
                    className="w-full"
                    placeholder="e.g. hip.hop"
                    value={newGoodTag}
                    onChange={(e) => setNewGoodTag(e.target.value)}
                  />
                </td>
                <td>
                  <span className="text-xs text-[var(--st-text-faint)]">
                    Canonical tag must exist
                  </span>
                </td>
                <td className="text-right">
                  <Button
                    variant="primary"
                    disabled={creating || !newBadTag || !newGoodTag}
                    onClick={handleCreate}
                  >
                    {creating ? 'Adding…' : 'Add alias'}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Panel>

      {error && <p className="text-sm text-[var(--st-danger)]">{error}</p>}

      <Pagination
        page={meta?.page ?? 1}
        totalPages={meta?.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default TagAliasesPage;
