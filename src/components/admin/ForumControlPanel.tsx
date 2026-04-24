import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetForumCategoriesQuery,
  useGetForumsQuery,
  useCreateForumMutation
} from '../../store/services/forumApi';
import Spinner from '../layout/Spinner';

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

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sort, setSort] = useState('');
  const [minClassRead, setMinClassRead] = useState('');
  const [minClassWrite, setMinClassWrite] = useState('');
  const [minClassCreate, setMinClassCreate] = useState('');

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
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Forum Manager</h2>
      </div>

      {/* Existing forums */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Existing Forums
          </h3>
        </div>
        {loadingCategories || loadingForums ? (
          <Spinner />
        ) : categoriesError || forumsError ? (
          <p className="p-4 text-sm text-red-400">Failed to load forums.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="text-left px-4 py-2 font-semibold">Category</th>
                <th className="text-right px-4 py-2 font-semibold">Sort</th>
                <th className="text-right px-4 py-2 font-semibold">Topics</th>
                <th className="text-right px-4 py-2 font-semibold">Posts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!forums?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No forums yet.
                  </td>
                </tr>
              ) : (
                forums.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-200 font-medium">
                      <Link
                        to={`/private/forums/${f.id}`}
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {f.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {f.forumCategory?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-right">
                      {f.sort}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-right">
                      {f.numTopics}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-right">
                      {f.numPosts}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create new forum */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Create Forum
          </h3>
        </div>
        <form onSubmit={handleCreate} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ff-category"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Category <span className="text-red-400">*</span>
              </label>
              <select
                id="ff-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Sort order
              </label>
              <input
                id="ff-sort"
                type="number"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="ff-name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Name <span className="text-red-400">*</span>
              </label>
              <input
                id="ff-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Forum name"
                className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="ff-description"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Description
              </label>
              <input
                id="ff-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">
              Minimum class to…
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="ff-read"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Read
                </label>
                <input
                  id="ff-read"
                  type="number"
                  value={minClassRead}
                  onChange={(e) => setMinClassRead(e.target.value)}
                  className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="ff-write"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Write
                </label>
                <input
                  id="ff-write"
                  type="number"
                  value={minClassWrite}
                  onChange={(e) => setMinClassWrite(e.target.value)}
                  className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="ff-create"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Create topics
                </label>
                <input
                  id="ff-create"
                  type="number"
                  value={minClassCreate}
                  onChange={(e) => setMinClassCreate(e.target.value)}
                  className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              {isCreating ? 'Creating…' : 'Create Forum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForumControlPanel;
