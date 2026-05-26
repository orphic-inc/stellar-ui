import { Link } from 'react-router-dom';
import { useGetEconomyStatsQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const EconomicStatsPage = () => {
  const { data, isLoading } = useGetEconomyStatsQuery();

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
        <h2 className="mt-1 text-2xl font-bold text-white">Economic Stats</h2>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Totals by Reason
        </h3>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Reason</th>
                <th className="text-right px-4 py-2 font-semibold">
                  Transactions
                </th>
                <th className="text-right px-4 py-2 font-semibold">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.grouped?.length ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No data.
                  </td>
                </tr>
              ) : (
                data.grouped.map((g) => (
                  <tr
                    key={g.reason}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-white font-mono text-xs">
                      {g.reason}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300">
                      {g._count}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300 font-mono">
                      {g._sum.amount != null
                        ? Number(g._sum.amount).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Recent Transactions
        </h3>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">User</th>
                <th className="text-left px-4 py-2 font-semibold">Reason</th>
                <th className="text-right px-4 py-2 font-semibold">Amount</th>
                <th className="text-left px-4 py-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.recent?.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No recent transactions.
                  </td>
                </tr>
              ) : (
                data.recent.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${t.user.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {t.user.username}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs font-mono">
                      {t.reason}
                    </td>
                    <td
                      className={`px-4 py-2 text-right text-xs font-mono ${
                        Number(t.amount) >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {Number(t.amount) >= 0 ? '+' : ''}
                      {Number(t.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={t.createdAt} />
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

export default EconomicStatsPage;
