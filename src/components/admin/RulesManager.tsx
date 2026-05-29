import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetRulesIndexQuery,
  useCreateRulesPageMutation,
  useUpdateRulesPageMutation,
  useDeleteRulesPageMutation,
  type RulesPage
} from '../../store/services/rulesApi';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const inputClass =
  'rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const MainPageEditor = ({ page }: { page: RulesPage | null }) => {
  const dispatch = useDispatch();
  const [createPage, { isLoading: creating }] = useCreateRulesPageMutation();
  const [updatePage, { isLoading: updating }] = useUpdateRulesPageMutation();

  const [title, setTitle] = useState(page?.title ?? '');
  const [body, setBody] = useState(page?.body ?? '');

  const saving = creating || updating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (page) {
        await updatePage({ id: page.id, title, body }).unwrap();
      } else {
        await createPage({ title, body, isMain: true, slug: 'main' }).unwrap();
      }
      dispatch(addAlert('Main rules page saved.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to save.', 'danger')
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Page title"
        required
        className={`${inputClass} w-full`}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body (HTML supported: p, b, i, a, ul, li, code, blockquote…)"
        rows={12}
        required
        className={`${inputClass} w-full font-mono`}
      />
      <button
        type="submit"
        disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
      >
        {saving ? 'Saving…' : page ? 'Save Changes' : 'Create Main Page'}
      </button>
    </form>
  );
};

const SubPageEditForm = ({
  page,
  onDone
}: {
  page: RulesPage;
  onDone: () => void;
}) => {
  const dispatch = useDispatch();
  const [updatePage, { isLoading }] = useUpdateRulesPageMutation();
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [sortOrder, setSortOrder] = useState(page.sortOrder ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePage({ id: page.id, title, body, sortOrder }).unwrap();
      dispatch(addAlert('Sub-page updated.', 'success'));
      onDone();
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to update.', 'danger')
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-gray-700 space-y-3 bg-indigo-950/20"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Edit: {page.title}
      </h4>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className={`${inputClass} w-full`}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
        rows={8}
        required
        className={`${inputClass} w-full font-mono`}
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400 whitespace-nowrap">
          Sort order
        </label>
        <input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className={`${inputClass} w-24`}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {isLoading ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-gray-400 hover:text-gray-200 px-4 py-2 rounded text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const SubPageForm = ({ onDone }: { onDone: () => void }) => {
  const dispatch = useDispatch();
  const [createPage, { isLoading }] = useCreateRulesPageMutation();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPage({ title, body, sortOrder }).unwrap();
      dispatch(addAlert('Sub-page created.', 'success'));
      setTitle('');
      setBody('');
      setSortOrder(0);
      onDone();
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to create.', 'danger')
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-gray-700 space-y-3"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        New Sub-page
      </h4>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (slug auto-generated)"
        required
        className={`${inputClass} w-full`}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body (HTML supported: p, b, i, a, ul, li, code, blockquote…)"
        rows={8}
        required
        className={`${inputClass} w-full font-mono`}
      />
      <div className="flex items-center gap-3">
        <label
          htmlFor="subpage-sort-order"
          className="text-sm text-gray-400 whitespace-nowrap"
        >
          Sort order
        </label>
        <input
          id="subpage-sort-order"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className={`${inputClass} w-24`}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {isLoading ? 'Creating…' : 'Create Sub-page'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-gray-400 hover:text-gray-200 px-4 py-2 rounded text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const RulesManager = () => {
  const { data, isLoading, error } = useGetRulesIndexQuery();
  const dispatch = useDispatch();
  const [deletePage] = useDeleteRulesPageMutation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deletePage(id).unwrap();
      dispatch(addAlert('Sub-page deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete.', 'danger')
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Rules Manager</h2>
      </div>

      {/* Main rules page editor */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Main Rules Page
          </h3>
        </div>
        <div className="p-4">
          {isLoading ? (
            <Spinner />
          ) : error ? (
            <p className="text-sm text-red-400">Failed to load.</p>
          ) : (
            <MainPageEditor page={data?.main ?? null} />
          )}
        </div>
      </div>

      {/* Sub-pages */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Sub-pages
          </h3>
          {!showNewForm && (
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + New sub-page
            </button>
          )}
        </div>

        {isLoading ? (
          <Spinner />
        ) : error ? (
          <p className="p-4 text-sm text-red-400">Failed to load sub-pages.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Title</th>
                <th className="text-left px-4 py-2 font-semibold">Slug</th>
                <th className="text-left px-4 py-2 font-semibold">Order</th>
                <th className="px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.pages.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No sub-pages yet.
                  </td>
                </tr>
              ) : (
                data.pages.map((page) => (
                  <>
                    <tr
                      key={page.id}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-200 font-medium">
                        <Link
                          to={`/private/rules/${page.slug}`}
                          className="hover:text-indigo-400 transition-colors"
                        >
                          {page.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                        {page.slug}
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        {page.sortOrder}
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingPageId(
                              editingPageId === page.id ? null : page.id
                            )
                          }
                          className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm mr-3"
                        >
                          {editingPageId === page.id ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(page.id, page.title)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {editingPageId === page.id && (
                      <tr key={`edit-${page.id}`}>
                        <td colSpan={4} className="p-0">
                          <SubPageEditForm
                            page={page}
                            onDone={() => setEditingPageId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        )}

        {showNewForm && <SubPageForm onDone={() => setShowNewForm(false)} />}
      </div>
    </div>
  );
};

export default RulesManager;
