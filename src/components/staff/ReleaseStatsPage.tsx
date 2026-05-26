import { Link } from 'react-router-dom';
import { useGetReleaseStatsQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';

const ReleaseStatsPage = () => {
  const { data, isLoading } = useGetReleaseStatsQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Release Stats</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Releases', value: data?.releases },
          { label: 'Contributions', value: data?.contributions },
          { label: 'Artists', value: data?.artists }
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center"
          >
            <div className="text-3xl font-bold text-white">
              {value?.toLocaleString() ?? '—'}
            </div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            By Type
          </h3>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                  <th className="text-left px-4 py-2 font-semibold">Type</th>
                  <th className="text-right px-4 py-2 font-semibold">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {data?.byType.map((row) => (
                  <tr
                    key={row.type}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-300">{row.type}</td>
                    <td className="px-4 py-2 text-right text-gray-400">
                      {row._count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            By Link Status
          </h3>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                  <th className="text-right px-4 py-2 font-semibold">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {data?.byLinkStatus.map((row) => (
                  <tr
                    key={row.linkStatus}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-300">
                      {row.linkStatus}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">
                      {row._count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseStatsPage;
