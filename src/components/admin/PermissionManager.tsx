import { Link } from 'react-router-dom';
import {
  useGetPermissionsQuery,
  useDeletePermissionMutation
} from '../../store/services/userApi';
import Spinner from '../layout/Spinner';

const PermissionManager = () => {
  const { data: permissions, isLoading, error } = useGetPermissionsQuery();
  const [deletePermission] = useDeletePermissionMutation();

  const handleDelete = async (id: number) => {
    if (
      window.confirm('Are you sure you want to remove this permission class?')
    ) {
      await deletePermission(id);
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <div className="error">Failed to load permissions.</div>;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/staff/tools/permissions/new" className="brackets">
          Create New Permission Class
        </Link>{' '}
        <Link to="/private/staff/tools" className="brackets">
          Back to Toolbox
        </Link>
      </div>
      <table width="100%" className="m_table">
        <thead>
          <tr className="colhead">
            <td>Name</td>
            <td>Level</td>
            <td>Users</td>
            <td>Actions</td>
          </tr>
        </thead>
        <tbody>
          {permissions?.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.level}</td>
              <td>{p.userCount ?? 0}</td>
              <td>
                <Link
                  to={`/private/staff/tools/permissions/${p.id}/edit`}
                  className="brackets"
                >
                  Edit
                </Link>{' '}
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="brackets btn-link"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PermissionManager;
