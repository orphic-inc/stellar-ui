import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetForumCategoriesQuery,
  useGetForumsQuery,
  useCreateForumMutation
} from '../../store/services/forumApi';
import Spinner from '../layout/Spinner';

const ForumControlPanel = () => {
  const { data: categories, isLoading: loadingCategories } =
    useGetForumCategoriesQuery();
  const { data: forums, isLoading: loadingForums } = useGetForumsQuery();
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
  };

  if (loadingCategories || loadingForums) return <Spinner />;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/staff/tools" className="brackets">
          Back to Toolbox
        </Link>
      </div>
      <h3>Forum Control Panel</h3>

      <div className="box">
        <div className="head colhead_dark">Existing Forums</div>
        <table className="m_table">
          <thead>
            <tr className="colhead">
              <td>Name</td>
              <td>Category</td>
              <td>Sort</td>
            </tr>
          </thead>
          <tbody>
            {forums?.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link to={`/private/forums/${f.id}`}>{f.name}</Link>
                </td>
                <td>{f.forumCategory?.name}</td>
                <td>{f.sort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="box pad">
        <h4>Create a new forum</h4>
        <form className="create_form" onSubmit={handleCreate}>
          <table className="layout">
            <tbody>
              <tr>
                <td className="label">Category</td>
                <td>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">Name</td>
                <td>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Description</td>
                <td>
                  <input
                    type="text"
                    size={60}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Sort</td>
                <td>
                  <input
                    type="number"
                    size={5}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Min class (read / write / create)</td>
                <td>
                  <input
                    type="number"
                    size={5}
                    value={minClassRead}
                    onChange={(e) => setMinClassRead(e.target.value)}
                  />
                  {' / '}
                  <input
                    type="number"
                    size={5}
                    value={minClassWrite}
                    onChange={(e) => setMinClassWrite(e.target.value)}
                  />
                  {' / '}
                  <input
                    type="number"
                    size={5}
                    value={minClassCreate}
                    onChange={(e) => setMinClassCreate(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="center">
                  <button type="submit" disabled={isCreating}>
                    Create
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
};

export default ForumControlPanel;
