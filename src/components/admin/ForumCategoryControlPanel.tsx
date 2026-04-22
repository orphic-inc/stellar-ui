import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetForumCategoriesQuery,
  useCreateForumCategoryMutation,
  useUpdateForumCategoryMutation,
  useDeleteForumCategoryMutation
} from '../../store/services/forumApi';
import Spinner from '../layout/Spinner';

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

  if (isLoading) return <Spinner />;
  if (error) return <div className="error">Failed to load categories.</div>;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/staff/tools" className="brackets">
          Back to Toolbox
        </Link>
      </div>
      <h3>Forum Category Control Panel</h3>

      {categories?.map((category) => (
        <CategoryRow key={category.id} category={category} />
      ))}

      <div className="box pad">
        <h4>Create a new forum category</h4>
        <form className="create_form" onSubmit={handleCreate}>
          <label>
            Sort:{' '}
            <input
              type="number"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              size={5}
            />
          </label>{' '}
          <label>
            Name:{' '}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>{' '}
          <button type="submit" disabled={isCreating}>
            Create
          </button>
        </form>
      </div>
    </div>
  );
};

const CategoryRow = ({ category }: { category: ForumCategory }) => {
  const [updateCategory] = useUpdateForumCategoryMutation();
  const [deleteCategory] = useDeleteForumCategoryMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCategory({ id: category.id, name });
    setEditing(false);
  };

  return (
    <div className="box pad">
      {editing ? (
        <form onSubmit={handleSave}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <span>
          <strong>{category.name}</strong>{' '}
          <button
            type="button"
            className="brackets btn-link"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>{' '}
          <button
            type="button"
            className="brackets btn-link"
            onClick={() =>
              window.confirm('Delete this category?') &&
              deleteCategory(category.id)
            }
          >
            Delete
          </button>
        </span>
      )}
    </div>
  );
};

export default ForumCategoryControlPanel;
