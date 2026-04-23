import { Link } from 'react-router-dom';
import {
  useGetUserRanksQuery,
  useDeleteUserRankMutation
} from '../../store/services/userApi';
import Spinner from '../layout/Spinner';

const PermissionManager = () => {
  const { data: permissions, isLoading, error } = useGetUserRanksQuery();
  const [deleteUserRank] = useDeleteUserRankMutation();

  const handleDelete = async (id: number) => {
    if (
      window.confirm('Are you sure you want to remove this permission class?')
    ) {
      await deleteUserRank(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Permissions Manager</h2>
        <div className="flex gap-3 text-sm">
          <Link
            to="/private/staff/tools/permissions/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            + New Permission Class
          </Link>
          <Link
            to="/private/staff/tools"
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors"
          >
            ← Toolbox
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-lg p-4 text-sm">
          Failed to load permissions.
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/60 text-gray-300 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Level</th>
                <th className="text-left px-4 py-3 font-semibold">Users</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!permissions?.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No permission classes defined yet.
                  </td>
                </tr>
              ) : (
                permissions.map(
                  (p: {
                    id: number;
                    name: string;
                    level: number;
                    userCount?: number;
                  }) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-200 font-medium">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{p.level}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {p.userCount ?? 0}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <Link
                          to={`/private/staff/tools/permissions/${p.id}/edit`}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
