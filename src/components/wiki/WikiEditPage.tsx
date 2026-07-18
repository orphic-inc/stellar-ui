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
        navigate(`/wiki/${page.id}`);
      } else {
        await updatePage({
          id: pageId!,
          title,
          body,
          ...(canManage ? { minReadLevel, minEditLevel } : {})
        }).unwrap();
        dispatch(addAlert('Page updated.', 'success'));
        navigate(`/wiki/${pageId}`);
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
          to={isNew ? '/wiki' : `/wiki/${pageId}`}
          data-st="control"
          className="text-xs"
        >
          ← {backLabel}
        </Link>
        <h1 data-st="prose" data-st-strong className="text-xl mt-1">
          {isNew ? 'New Wiki Page' : `Edit: ${existing?.title}`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div data-st="panel" className="p-5 space-y-4">
          <div>
            <label
              htmlFor="wiki-title"
              data-st="meta"
              className="block text-sm mb-1"
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
              data-st="field"
              className="w-full"
            />
          </div>

          {isNew && (
            <div>
              <label
                htmlFor="wiki-slug"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Slug{' '}
                <span className="text-xs">
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
                data-st="field"
                className="w-full font-mono"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="wiki-body"
              data-st="meta"
              className="block text-sm mb-1"
            >
              Body{' '}
              <span className="text-xs">
                (HTML supported: b, i, a, ul, code, pre, blockquote…)
              </span>
            </label>
            <textarea
              id="wiki-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={20}
              data-st="field"
              className="w-full font-mono"
            />
          </div>

          {canManage && (
            <div className="grid grid-cols-2 gap-4 border-t border-[var(--st-border)] pt-4">
              <div>
                <label
                  htmlFor="wiki-min-read"
                  data-st="meta"
                  className="block text-sm mb-1"
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
                  data-st="field"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="wiki-min-edit"
                  data-st="meta"
                  className="block text-sm mb-1"
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
                  data-st="field"
                  className="w-full"
                />
              </div>
              <p data-st="meta" className="col-span-2 text-xs">
                Set to 0 for no restriction. minEditLevel is automatically
                clamped to at least minReadLevel.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            to={isNew ? '/wiki' : `/wiki/${pageId}`}
            data-st="control"
            className="text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            data-st="control"
            data-st-primary
            className="text-sm"
          >
            {isSaving ? 'Saving…' : isNew ? 'Create Page' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WikiEditPage;
