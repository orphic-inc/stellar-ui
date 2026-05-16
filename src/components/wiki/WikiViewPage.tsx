import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DOMPurify from 'dompurify';
import {
  useGetWikiPageQuery,
  useDeleteWikiPageMutation,
  useAddWikiAliasMutation,
  useDeleteWikiAliasMutation
} from '../../store/services/wikiApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission } from '../../utils/permissions';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const ALLOWED_WIKI_TAGS = [
  'b',
  'i',
  'u',
  'em',
  'strong',
  'a',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'span',
  'h1',
  'h2',
  'h3'
];

const WikiViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const pageId = Number(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: user } = useGetMeQuery();
  const { data: page, isLoading, error } = useGetWikiPageQuery(pageId);

  const [deletePage, { isLoading: isDeleting }] = useDeleteWikiPageMutation();
  const [addAlias, { isLoading: isAddingAlias }] = useAddWikiAliasMutation();
  const [deleteAlias] = useDeleteWikiAliasMutation();
  const [aliasInput, setAliasInput] = useState('');
  const [showAliasForm, setShowAliasForm] = useState(false);

  if (isLoading) return <Spinner />;
  if (error || !page)
    return <div className="p-4 text-red-400">Page not found.</div>;

  const userRankLevel =
    (user as { userRankLevel?: number } | undefined)?.userRankLevel ?? 0;
  const canManage = hasAnyPermission(user, ['wiki_manage', 'admin', 'staff']);
  const canEdit =
    canManage ||
    (hasAnyPermission(user, ['wiki_edit']) &&
      userRankLevel >= page.minEditLevel);

  const renderedBody = DOMPurify.sanitize(page.body, {
    ALLOWED_TAGS: ALLOWED_WIKI_TAGS,
    ALLOWED_ATTR: ['href', 'class', 'rel', 'target']
  });

  const handleDelete = async () => {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    try {
      await deletePage(pageId).unwrap();
      dispatch(addAlert('Page deleted.', 'success'));
      navigate('/private/wiki');
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete.', 'danger')
      );
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAlias({ id: pageId, alias: aliasInput.trim() }).unwrap();
      dispatch(addAlert('Alias added.', 'success'));
      setAliasInput('');
      setShowAliasForm(false);
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to add alias.', 'danger')
      );
    }
  };

  const handleDeleteAlias = async (alias: string) => {
    if (!confirm(`Remove alias "${alias}"?`)) return;
    try {
      await deleteAlias({ id: pageId, alias }).unwrap();
      dispatch(addAlert('Alias removed.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to remove alias.', 'danger')
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link
            to="/private/wiki"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Wiki
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">{page.title}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Revision {page.revision} · Last edited{' '}
            {new Date(page.updatedAt).toLocaleDateString()} by{' '}
            <Link
              to={`/private/user/${page.author.id}`}
              className="text-indigo-400 hover:text-indigo-300"
            >
              {page.author.username}
            </Link>
            {page.minReadLevel > 0 && (
              <span className="ml-2 text-amber-500">
                · Requires level {page.minReadLevel} to read
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 mt-1">
          <Link
            to={`/private/wiki/${pageId}/history`}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            History
          </Link>
          {canEdit && (
            <Link
              to={`/private/wiki/${pageId}/edit`}
              className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              Edit
            </Link>
          )}
          {canManage && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm text-white bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        className="prose prose-invert prose-sm max-w-none bg-gray-900 border border-gray-700 rounded-lg p-6 text-gray-200 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderedBody }}
      />

      {/* Aliases */}
      <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Aliases</h3>
          {canEdit && !showAliasForm && (
            <button
              onClick={() => setShowAliasForm(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + Add alias
            </button>
          )}
        </div>

        {page.aliases.length === 0 && !showAliasForm && (
          <p className="text-xs text-gray-600">No aliases.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {page.aliases.map((a) => (
            <span
              key={a.alias}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded"
            >
              {a.alias}
              {canEdit && a.alias !== page.slug && (
                <button
                  onClick={() => handleDeleteAlias(a.alias)}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                  title="Remove alias"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

        {showAliasForm && (
          <form onSubmit={handleAddAlias} className="flex gap-2 mt-3">
            <input
              type="text"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="new-alias"
              pattern="[a-z0-9-]+"
              required
              className="flex-1 rounded bg-gray-800 border border-gray-600 text-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isAddingAlias}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs rounded transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAliasForm(false)}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WikiViewPage;
