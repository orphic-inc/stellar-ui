import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetForumCategoriesAdminQuery,
  useCreateForumCategoryMutation,
  useUpdateForumCategoryMutation,
  useDeleteForumCategoryMutation
} from '../../store/services/forumApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import type { ForumCategory } from '../../types';
import { PageShell, Panel, Button, SectionHeading } from '../ui';

const CategoryRow = ({ category }: { category: ForumCategory }) => {
  const dispatch = useDispatch();
  const [updateCategory] = useUpdateForumCategoryMutation();
  const [deleteCategory] = useDeleteForumCategoryMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [sort, setSort] = useState(String(category.sort));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCategory({
        id: category.id,
        name,
        sort: parseInt(sort) || 0
      }).unwrap();
      setEditing(false);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to save the category.',
          'danger'
        )
      );
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(category.id).unwrap();
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to delete the category.',
          'danger'
        )
      );
    }
  };

  if (editing) {
    return (
      <tr data-st="row" data-st-open>
        <td colSpan={3} className="p-0">
          <form
            onSubmit={handleSave}
            className="p-4 flex gap-2 items-end flex-wrap"
          >
            <div>
              <label
                htmlFor={`edit-fc-sort-${category.id}`}
                data-st="meta"
                className="block mb-1"
              >
                Sort
              </label>
              <input
                id={`edit-fc-sort-${category.id}`}
                data-st="field"
                type="number"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-16"
              />
            </div>
            <div>
              <label
                htmlFor={`edit-fc-name-${category.id}`}
                data-st="meta"
                className="block mb-1"
              >
                Name
              </label>
              <input
                id={`edit-fc-name-${category.id}`}
                data-st="field"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-52"
              />
            </div>
            <Button variant="primary" type="submit">
              Save
            </Button>
            <Button variant="link" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr data-st="row">
      <td>{category.sort}</td>
      <td className="font-medium">{category.name}</td>
      <td className="text-right space-x-3 whitespace-nowrap">
        <Button variant="link" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="link-danger" onClick={handleDelete}>
          Delete
        </Button>
      </td>
    </tr>
  );
};

const ForumCategoryControlPanel = () => {
  const dispatch = useDispatch();
  const {
    data: categories,
    isLoading,
    error
  } = useGetForumCategoriesAdminQuery();
  const [createCategory, { isLoading: isCreating }] =
    useCreateForumCategoryMutation();
  const [name, setName] = useState('');
  const [sort, setSort] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory({ name, sort: parseInt(sort) || 0 }).unwrap();
      setName('');
      setSort('');
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to create the category.',
          'danger'
        )
      );
    }
  };

  return (
    <PageShell title="Forum Category Manager" width="sm">
      <section className="space-y-3">
        <SectionHeading>Categories</SectionHeading>
        <Panel className="overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <Spinner />
            </div>
          ) : error ? (
            <p data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
              Failed to load categories.
            </p>
          ) : (
            <table data-st="grid">
              <thead data-st="colhead">
                <tr>
                  <th className="w-16">Sort</th>
                  <th>Name</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {!categories?.length ? (
                  <tr data-st="row">
                    <td colSpan={3} className="text-center">
                      No categories yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => <CategoryRow key={c.id} category={c} />)
                )}
              </tbody>
            </table>
          )}
        </Panel>
      </section>

      <section className="space-y-3">
        <SectionHeading>Create Category</SectionHeading>
        <Panel
          as="form"
          onSubmit={handleCreate}
          className="p-4 flex gap-4 items-end flex-wrap"
        >
          <div>
            <label
              htmlFor="fc-sort"
              data-st="meta"
              className="block text-sm font-medium mb-1"
            >
              Sort order
            </label>
            <input
              id="fc-sort"
              data-st="field"
              type="number"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-20"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label
              htmlFor="fc-name"
              data-st="meta"
              className="block text-sm font-medium mb-1"
            >
              Name <span className="text-[var(--st-danger)]">*</span>
            </label>
            <input
              id="fc-name"
              data-st="field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Category name"
              className="w-full"
            />
          </div>
          <Button variant="primary" type="submit" disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create'}
          </Button>
        </Panel>
      </section>
    </PageShell>
  );
};

export default ForumCategoryControlPanel;
