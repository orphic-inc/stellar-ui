import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetWikiPageQuery,
  useCreateWikiPageMutation,
  useUpdateWikiPageMutation
} from '../../store/services/wikiApi';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission } from '../../utils/permissions';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const WikiEditPage = () => {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const pageId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: user } = useGetMeQuery();

  const { data: existing, isLoading: isLoadingPage } = useGetWikiPageQuery(
    pageId!,
    { skip: isNew }
  );

  const [createPage, { isLoading: isCreating }] = useCreateWikiPageMutation();
  const [updatePage, { isLoading: isUpdating }] = useUpdateWikiPageMutation();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [slug, setSlug] = useState('');
  const [minReadLevel, setMinReadLevel] = useState(0);
  const [minEditLevel, setMinEditLevel] = useState(0);

  const canManage = hasAnyPermission(user, ['wiki_manage', 'admin', 'staff']);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setBody(existing.body);
      setSlug(existing.slug);
      setMinReadLevel(existing.minReadLevel);
      setMinEditLevel(existing.minEditLevel);
    }
  }, [existing]);

  if (!isNew && isLoadingPage) return <Spinner />;

  const isSaving = isCreating || isUpdating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNew) {
        const page = await createPage({
          title,
          body,
          slug: slug || undefined,
          ...(canManage ? { minReadLevel, minEditLevel } : {})
        }).unwrap();
        dispatch(addAlert('Page created.', 'success'));
        navigate(`/private/wiki/${page.id}`);
      } else {
        await updatePage({
          id: pageId!,
          title,
          body,
          ...(canManage ? { minReadLevel, minEditLevel } : {})
        }).unwrap();
        dispatch(addAlert('Page updated.', 'success'));
        navigate(`/private/wiki/${pageId}`);
      }
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to save.', 'danger')
      );
    }
  };

  // prettier-ignore
  const backLabel = isNew ? 'Wiki' : (existing?.title ?? 'Back');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link
          to={isNew ? '/private/wiki' : `/private/wiki/${pageId}`}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← {backLabel}
        </Link>
        <h1 className="text-xl font-bold text-white mt-1">
          {isNew ? 'New Wiki Page' : `Edit: ${existing?.title}`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 space-y-4">
          <div>
            <label
              htmlFor="wiki-title"
              className="block text-sm text-gray-300 mb-1"
            >
              Title
            </label>
            <input
              id="wiki-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {isNew && (
            <div>
              <label
                htmlFor="wiki-slug"
                className="block text-sm text-gray-300 mb-1"
              >
                Slug{' '}
                <span className="text-gray-500 text-xs">
                  (optional — derived from title if blank)
                </span>
              </label>
              <input
                id="wiki-slug"
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  )
                }
                maxLength={50}
                placeholder="my-page-slug"
                pattern="[a-z0-9-]*"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="wiki-body"
              className="block text-sm text-gray-300 mb-1"
            >
              Body{' '}
              <span className="text-gray-500 text-xs">
                (HTML supported: b, i, a, ul, code, pre, blockquote…)
              </span>
            </label>
            <textarea
              id="wiki-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={20}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {canManage && (
            <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
              <div>
                <label
                  htmlFor="wiki-min-read"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Min rank level to read
                </label>
                <input
                  id="wiki-min-read"
                  type="number"
                  min={0}
                  max={1000}
                  value={minReadLevel}
                  onChange={(e) => setMinReadLevel(Number(e.target.value))}
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="wiki-min-edit"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Min rank level to edit
                </label>
                <input
                  id="wiki-min-edit"
                  type="number"
                  min={0}
                  max={1000}
                  value={minEditLevel}
                  onChange={(e) => setMinEditLevel(Number(e.target.value))}
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="col-span-2 text-xs text-gray-500">
                Set to 0 for no restriction. minEditLevel is automatically
                clamped to at least minReadLevel.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            to={isNew ? '/private/wiki' : `/private/wiki/${pageId}`}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {isSaving ? 'Saving…' : isNew ? 'Create Page' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WikiEditPage;
