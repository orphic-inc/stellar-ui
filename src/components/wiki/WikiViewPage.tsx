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
  // note: red-400 load-error lines are left as-is across the sweep

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
      navigate('/wiki');
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
          <Link to="/wiki" data-st="control" className="text-xs">
            ← Wiki
          </Link>
          <h1 data-st="prose" data-st-strong className="text-2xl mt-1">
            {page.title}
          </h1>
          <p data-st="meta" className="text-xs mt-1">
            Revision {page.revision} · Last edited{' '}
            {new Date(page.updatedAt).toLocaleDateString()} by{' '}
            <Link to={`/user/${page.author.id}`} data-st="control">
              {page.author.username}
            </Link>
            {page.minReadLevel > 0 && (
              <span className="ml-2 text-[var(--st-warning)]">
                · Requires level {page.minReadLevel} to read
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 mt-1">
          {/* Secondary pill: bordered token control (no filled/outlined
              conflict); Edit/Delete are filled status controls. */}
          <Link
            to={`/wiki/${pageId}/history`}
            data-st="control"
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--st-border)] hover:border-[var(--st-border-strong)]"
          >
            History
          </Link>
          {canEdit && (
            <Link
              to={`/wiki/${pageId}/edit`}
              data-st="control"
              data-st-primary
              className="text-sm"
            >
              Edit
            </Link>
          )}
          {canManage && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              data-st="control"
              data-st-primary
              data-st-danger
              className="text-sm"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        data-st="panel"
        className="prose prose-invert prose-sm max-w-none p-6 text-[var(--st-text)] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderedBody }}
      />

      {/* Aliases */}
      <div data-st="panel" className="mt-6 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 data-st="prose" data-st-strong className="text-sm">
            Aliases
          </h3>
          {canEdit && !showAliasForm && (
            <button
              onClick={() => setShowAliasForm(true)}
              data-st="control"
              className="text-xs"
            >
              + Add alias
            </button>
          )}
        </div>

        {page.aliases.length === 0 && !showAliasForm && (
          <p data-st="meta" className="text-xs">
            No aliases.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {page.aliases.map((a) => (
            <span
              key={a.alias}
              data-st="chip"
              className="inline-flex items-center gap-1"
            >
              {a.alias}
              {canEdit && a.alias !== page.slug && (
                <button
                  onClick={() => handleDeleteAlias(a.alias)}
                  data-st="control"
                  data-st-danger
                  className="ml-1"
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
              data-st="field"
              className="flex-1 text-xs"
            />
            <button
              type="submit"
              disabled={isAddingAlias}
              data-st="control"
              data-st-primary
              className="text-xs"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAliasForm(false)}
              data-st="control"
              className="text-xs"
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
