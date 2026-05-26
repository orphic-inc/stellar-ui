import { Link } from 'react-router-dom';
import { useGetClientStatsQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';

const ClientStatsPage = () => {
  const { data, isLoading } = useGetClientStatsQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">
          OS &amp; Browser Usage
        </h2>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
              <th className="text-left px-4 py-2 font-semibold">User Agent</th>
              <th className="text-right px-4 py-2 font-semibold">Sessions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {!data?.length ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                  No data.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-gray-300">
                    {row.userAgent ?? (
                      <span className="text-gray-500 italic">unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-400 text-xs">
                    {row.count.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientStatsPage;
