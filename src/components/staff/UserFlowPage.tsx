import { Link } from 'react-router-dom';
import { useGetUserFlowQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
  USED: 'Used',
  CANCELLED: 'Cancelled'
};

const UserFlowPage = () => {
  const { data, isLoading } = useGetUserFlowQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">User Flow</h2>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Invite Funnel
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {data?.inviteFunnel.map((item) => (
            <div
              key={item.status}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center"
            >
              <div className="text-2xl font-bold text-white">{item._count}</div>
              <div className="text-xs text-gray-400 mt-1">
                {STATUS_LABELS[item.status] ?? item.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Site Growth (Last 12 Snapshots)
        </h3>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Date</th>
                <th className="text-right px-4 py-2 font-semibold">
                  Total Users
                </th>
                <th className="text-right px-4 py-2 font-semibold">
                  Active This Month
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.snapshots.length ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No snapshots available.
                  </td>
                </tr>
              ) : (
                data.snapshots.map((s) => (
                  <tr
                    key={s.bucketAt}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={s.bucketAt} />
                    </td>
                    <td className="px-4 py-2 text-right text-white">
                      {s.totalUsers.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300">
                      {s.activeThisMonth.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserFlowPage;
