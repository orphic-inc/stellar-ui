import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetForumCategoriesQuery,
  useCreateForumCategoryMutation,
  useUpdateForumCategoryMutation,
  useDeleteForumCategoryMutation
} from '../../store/services/forumApi';
import Spinner from '../layout/Spinner';
import type { ForumCategory } from '../../types';

const CategoryRow = ({ category }: { category: ForumCategory }) => {
  const [updateCategory] = useUpdateForumCategoryMutation();
  const [deleteCategory] = useDeleteForumCategoryMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [sort, setSort] = useState(String(category.sort));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCategory({ id: category.id, name, sort: parseInt(sort) || 0 });
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="bg-indigo-950/30">
        <td className="px-4 py-2" colSpan={3}>
          <form
            onSubmit={handleSave}
            className="flex gap-2 items-end flex-wrap"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sort</label>
              <input
                type="number"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-16 rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-700/30 transition-colors">
      <td className="px-4 py-2 text-gray-400 text-sm">{category.sort}</td>
      <td className="px-4 py-2 text-gray-200 font-medium text-sm">
        {category.name}
      </td>
      <td className="px-4 py-2 flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() =>
            window.confirm('Delete this category?') &&
            deleteCategory(category.id)
          }
          className="text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

const ForumCategoryControlPanel = () => {
  const { data: categories, isLoading, error } = useGetForumCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] =
    useCreateForumCategoryMutation();
  const [name, setName] = useState('');
  const [sort, setSort] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory({ name, sort: parseInt(sort) || 0 });
    setName('');
    setSort('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Forum Category Manager
        </h2>
      </div>

      {/* Category list */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Categories
          </h3>
        </div>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <p className="p-4 text-sm text-red-400">Failed to load categories.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold w-16">Sort</th>
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!categories?.length ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                  >
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.map((c) => <CategoryRow key={c.id} category={c} />)
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create new */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Create Category
          </h3>
        </div>
        <form
          onSubmit={handleCreate}
          className="p-4 flex gap-4 items-end flex-wrap"
        >
          <div>
            <label
              htmlFor="fc-sort"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Sort order
            </label>
            <input
              id="fc-sort"
              type="number"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-20 rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label
              htmlFor="fc-name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="fc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Category name"
              className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {isCreating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForumCategoryControlPanel;
