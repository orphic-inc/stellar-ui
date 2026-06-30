import { Fragment, useState } from 'react';
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
import { PageShell, Panel, Button, Field, SectionHeading } from '../ui';

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
    <Panel as="form" onSubmit={handleSubmit} className="p-4 space-y-3">
      <Field
        label="Page title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Page title"
        required
      />
      <textarea
        data-st="field"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body (HTML supported: p, b, i, a, ul, li, code, blockquote…)"
        rows={12}
        required
        className="w-full font-mono"
      />
      <Button variant="primary" type="submit" disabled={saving}>
        {saving ? 'Saving…' : page ? 'Save Changes' : 'Create Main Page'}
      </Button>
    </Panel>
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
      className="p-4 border-t border-[var(--st-border)] space-y-3"
    >
      <SectionHeading className="text-xs">Edit: {page.title}</SectionHeading>
      <Field
        label="Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
      />
      <textarea
        data-st="field"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
        rows={8}
        required
        className="w-full font-mono"
      />
      <div className="flex items-center gap-3">
        <label
          htmlFor={`spe-sort-${page.id}`}
          data-st="meta"
          className="whitespace-nowrap"
        >
          Sort order
        </label>
        <input
          id={`spe-sort-${page.id}`}
          data-st="field"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-24"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button variant="link" onClick={onDone}>
          Cancel
        </Button>
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
      className="p-4 border-t border-[var(--st-border)] space-y-3"
    >
      <SectionHeading className="text-xs">New Sub-page</SectionHeading>
      <Field
        label="Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (slug auto-generated)"
        required
      />
      <textarea
        data-st="field"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body (HTML supported: p, b, i, a, ul, li, code, blockquote…)"
        rows={8}
        required
        className="w-full font-mono"
      />
      <div className="flex items-center gap-3">
        <label
          htmlFor="subpage-sort-order"
          data-st="meta"
          className="whitespace-nowrap"
        >
          Sort order
        </label>
        <input
          id="subpage-sort-order"
          data-st="field"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-24"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create Sub-page'}
        </Button>
        <Button variant="link" onClick={onDone}>
          Cancel
        </Button>
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
    <PageShell title="Rules Manager" width="lg">
      {/* Main rules page editor */}
      <section className="space-y-3">
        <SectionHeading>Main Rules Page</SectionHeading>
        {isLoading ? (
          <Panel className="p-6">
            <Spinner />
          </Panel>
        ) : error ? (
          <Panel className="p-4">
            <p data-st="prose" className="text-sm text-[var(--st-danger)]">
              Failed to load.
            </p>
          </Panel>
        ) : (
          <MainPageEditor page={data?.main ?? null} />
        )}
      </section>

      {/* Sub-pages */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>Sub-pages</SectionHeading>
          {!showNewForm && (
            <Button variant="link" onClick={() => setShowNewForm(true)}>
              + New sub-page
            </Button>
          )}
        </div>

        <Panel className="overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <Spinner />
            </div>
          ) : error ? (
            <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
              Failed to load sub-pages.
            </p>
          ) : (
            <table data-st="grid">
              <thead data-st="colhead">
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {!data?.pages.length ? (
                  <tr data-st="row">
                    <td colSpan={4} className="text-center">
                      No sub-pages yet.
                    </td>
                  </tr>
                ) : (
                  data.pages.map((page) => (
                    <Fragment key={page.id}>
                      <tr data-st="row">
                        <td className="font-medium">
                          <Link
                            to={`/private/rules/${page.slug}`}
                            data-st="control"
                          >
                            {page.title}
                          </Link>
                        </td>
                        <td className="font-mono text-xs">{page.slug}</td>
                        <td>{page.sortOrder}</td>
                        <td className="text-right space-x-3 whitespace-nowrap">
                          <Button
                            variant="link"
                            onClick={() =>
                              setEditingPageId(
                                editingPageId === page.id ? null : page.id
                              )
                            }
                          >
                            {editingPageId === page.id ? 'Cancel' : 'Edit'}
                          </Button>
                          <Button
                            variant="link-danger"
                            onClick={() => handleDelete(page.id, page.title)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                      {editingPageId === page.id && (
                        <tr data-st="row" data-st-open>
                          <td colSpan={4} className="p-0">
                            <SubPageEditForm
                              page={page}
                              onDone={() => setEditingPageId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          )}

          {showNewForm && <SubPageForm onDone={() => setShowNewForm(false)} />}
        </Panel>
      </section>
    </PageShell>
  );
};

export default RulesManager;
