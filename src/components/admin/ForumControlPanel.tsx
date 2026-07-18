import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetForumCategoriesQuery,
  useGetForumsQuery,
  useCreateForumMutation,
  useUpdateForumMutation,
  useDeleteForumMutation
} from '../../store/services/forumApi';
import type { Forum } from '../../types';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Button, SectionHeading } from '../ui';

interface EditRowProps {
  forum: Forum;
  onDone: () => void;
}

const ForumEditRow = ({ forum, onDone }: EditRowProps) => {
  const [updateForum, { isLoading }] = useUpdateForumMutation();
  const [name, setName] = useState(forum.name);
  const [description, setDescription] = useState(forum.description ?? '');
  const [sort, setSort] = useState(String(forum.sort ?? 0));
  const [minRead, setMinRead] = useState(String(forum.minClassRead ?? 0));
  const [minWrite, setMinWrite] = useState(String(forum.minClassWrite ?? 0));
  const [minCreate, setMinCreate] = useState(String(forum.minClassCreate ?? 0));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateForum({
      id: forum.id,
      name,
      description,
      sort: parseInt(sort) || 0,
      minClassRead: parseInt(minRead) || 0,
      minClassWrite: parseInt(minWrite) || 0,
      minClassCreate: parseInt(minCreate) || 0
    });
    onDone();
  };

  return (
    <tr data-st="row" data-st-open>
      <td colSpan={6} className="p-0">
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <label
                htmlFor={`fe-name-${forum.id}`}
                data-st="meta"
                className="block mb-0.5"
              >
                Name *
              </label>
              <input
                id={`fe-name-${forum.id}`}
                data-st="field"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor={`fe-sort-${forum.id}`}
                data-st="meta"
                className="block mb-0.5"
              >
                Sort
              </label>
              <input
                id={`fe-sort-${forum.id}`}
                data-st="field"
                type="number"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor={`fe-minread-${forum.id}`}
                data-st="meta"
                className="block mb-0.5"
              >
                Min read
              </label>
              <input
                id={`fe-minread-${forum.id}`}
                data-st="field"
                type="number"
                value={minRead}
                onChange={(e) => setMinRead(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor={`fe-desc-${forum.id}`}
                data-st="meta"
                className="block mb-0.5"
              >
                Description
              </label>
              <input
                id={`fe-desc-${forum.id}`}
                data-st="field"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor={`fe-minwrite-${forum.id}`}
                data-st="meta"
                className="block mb-0.5"
              >
                Min write
              </label>
              <input
                id={`fe-minwrite-${forum.id}`}
                data-st="field"
                type="number"
                value={minWrite}
                onChange={(e) => setMinWrite(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor={`fe-mincreate-${forum.id}`}
                data-st="meta"
                className="block mb-0.5"
              >
                Min create topics
              </label>
              <input
                id={`fe-mincreate-${forum.id}`}
                data-st="field"
                type="number"
                value={minCreate}
                onChange={(e) => setMinCreate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="link" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
};

const ForumControlPanel = () => {
  const {
    data: categories,
    isLoading: loadingCategories,
    error: categoriesError
  } = useGetForumCategoriesQuery();
  const {
    data: forums,
    isLoading: loadingForums,
    error: forumsError
  } = useGetForumsQuery();
  const [createForum, { isLoading: isCreating }] = useCreateForumMutation();
  const [deleteForum] = useDeleteForumMutation();

  const [editingId, setEditingId] = useState<number | null>(null);

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sort, setSort] = useState('');
  const [minClassRead, setMinClassRead] = useState('');
  const [minClassWrite, setMinClassWrite] = useState('');
  const [minClassCreate, setMinClassCreate] = useState('');

  const handleDelete = async (id: number, forumName: string) => {
    if (!confirm(`Delete forum "${forumName}"? This cannot be undone.`)) return;
    await deleteForum(id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createForum({
      forumCategoryId: parseInt(categoryId),
      name,
      description,
      sort: parseInt(sort) || 0,
      minClassRead: parseInt(minClassRead) || 0,
      minClassWrite: parseInt(minClassWrite) || 0,
      minClassCreate: parseInt(minClassCreate) || 0
    });
    setName('');
    setDescription('');
    setSort('');
    setMinClassRead('');
    setMinClassWrite('');
    setMinClassCreate('');
    setCategoryId('');
  };

  return (
    <PageShell title="Forum Manager" width="md">
      <section className="space-y-3">
        <SectionHeading>Existing Forums</SectionHeading>
        <Panel className="overflow-hidden">
          {loadingCategories || loadingForums ? (
            <div className="p-6">
              <Spinner />
            </div>
          ) : categoriesError || forumsError ? (
            <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
              Failed to load forums.
            </p>
          ) : (
            <table data-st="grid">
              <thead data-st="colhead">
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th data-st-num>Sort</th>
                  <th data-st-num>Topics</th>
                  <th data-st-num>Posts</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {!forums?.length ? (
                  <tr data-st="row">
                    <td colSpan={6} className="text-center">
                      No forums yet.
                    </td>
                  </tr>
                ) : (
                  forums.map((f) => (
                    <Fragment key={f.id}>
                      <tr data-st="row">
                        <td className="font-medium">
                          <Link to={`/forums/${f.id}`} data-st="control">
                            {f.name}
                          </Link>
                        </td>
                        <td>{f.forumCategory?.name ?? '—'}</td>
                        <td data-st-num>{f.sort}</td>
                        <td data-st-num>{f.numTopics}</td>
                        <td data-st-num>{f.numPosts}</td>
                        <td className="text-right space-x-3 whitespace-nowrap">
                          <Button
                            variant="link"
                            onClick={() =>
                              setEditingId(editingId === f.id ? null : f.id)
                            }
                          >
                            {editingId === f.id ? 'Cancel' : 'Edit'}
                          </Button>
                          <Button
                            variant="link-danger"
                            onClick={() => handleDelete(f.id, f.name)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                      {editingId === f.id && (
                        <ForumEditRow
                          forum={f}
                          onDone={() => setEditingId(null)}
                        />
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          )}
        </Panel>
      </section>

      <section className="space-y-3">
        <SectionHeading>Create Forum</SectionHeading>
        <Panel as="form" onSubmit={handleCreate} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ff-category"
                data-st="meta"
                className="block text-sm font-medium mb-1"
              >
                Category <span className="text-[var(--st-danger)]">*</span>
              </label>
              <select
                id="ff-category"
                data-st="field"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full"
              >
                <option value="">Select a category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ff-sort"
                data-st="meta"
                className="block text-sm font-medium mb-1"
              >
                Sort order
              </label>
              <input
                id="ff-sort"
                data-st="field"
                type="number"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="ff-name"
                data-st="meta"
                className="block text-sm font-medium mb-1"
              >
                Name <span className="text-[var(--st-danger)]">*</span>
              </label>
              <input
                id="ff-name"
                data-st="field"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Forum name"
                className="w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="ff-description"
                data-st="meta"
                className="block text-sm font-medium mb-1"
              >
                Description
              </label>
              <input
                id="ff-description"
                data-st="field"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <p data-st="prose" className="text-sm font-medium mb-2">
              Minimum class to…
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="ff-read" data-st="meta" className="block mb-1">
                  Read
                </label>
                <input
                  id="ff-read"
                  data-st="field"
                  type="number"
                  value={minClassRead}
                  onChange={(e) => setMinClassRead(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="ff-write" data-st="meta" className="block mb-1">
                  Write
                </label>
                <input
                  id="ff-write"
                  data-st="field"
                  type="number"
                  value={minClassWrite}
                  onChange={(e) => setMinClassWrite(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="ff-create"
                  data-st="meta"
                  className="block mb-1"
                >
                  Create topics
                </label>
                <input
                  id="ff-create"
                  data-st="field"
                  type="number"
                  value={minClassCreate}
                  onChange={(e) => setMinClassCreate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create Forum'}
            </Button>
          </div>
        </Panel>
      </section>
    </PageShell>
  );
};

export default ForumControlPanel;
