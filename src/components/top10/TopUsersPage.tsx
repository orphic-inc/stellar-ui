import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTopUsersQuery,
  type UsersParams
} from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';
import { formatBytes } from '../../utils';

type UserType = NonNullable<UsersParams['type']>;
type LimitValue = 10 | 100 | 250;

const TYPE_LABELS: Record<UserType, string> = {
  contributed: 'Most Contributed',
  consumed: 'Most Consumed',
  numContributions: 'Most Contributions',
  contributionSpeed: 'Fastest Contributors',
  consumeSpeed: 'Fastest Consumers'
};

const ratioColor = (ratio: number) => {
  if (ratio >= 1.0) return 'text-green-400';
  if (ratio >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
};

const fmtSpeed = (bytesPerSec: number) => {
  if (bytesPerSec <= 0) return '—';
  return `${formatBytes(bytesPerSec)}/s`;
};

const selectCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const TopUsersPage = () => {
  const [type, setType] = useState<UserType>('contributed');
  const [limit, setLimit] = useState<LimitValue>(10);

  const { data, isLoading, error } = useGetTopUsersQuery({ type, limit });

  const showSpeed = type === 'contributionSpeed' || type === 'consumeSpeed';
  const showContributed = type !== 'consumed';
  const showConsumed = type !== 'contributed' && type !== 'numContributions';

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label
            htmlFor="users-metric"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Metric
          </label>
          <select
            id="users-metric"
            className={selectCls}
            value={type}
            onChange={(e) => setType(e.target.value as UserType)}
          >
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="users-limit"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Limit
          </label>
          <select
            id="users-limit"
            className={selectCls}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) as LimitValue)}
          >
            {[10, 100, 250].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <Spinner />}
      {error && (
        <p className="text-red-400 text-sm">Failed to load top users.</p>
      )}
      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">
                <th className="pb-2 pr-3 w-8">#</th>
                <th className="pb-2 pr-3">User</th>
                {showContributed && (
                  <th className="pb-2 pr-3 text-right">Contributed</th>
                )}
                {showSpeed && type === 'contributionSpeed' && (
                  <th className="pb-2 pr-3 text-right">Contrib. Speed</th>
                )}
                {showConsumed && (
                  <th className="pb-2 pr-3 text-right">Consumed</th>
                )}
                {showSpeed && type === 'consumeSpeed' && (
                  <th className="pb-2 pr-3 text-right">Consume Speed</th>
                )}
                {type === 'numContributions' && (
                  <th className="pb-2 pr-3 text-right">Contributions</th>
                )}
                <th className="pb-2 pr-3 text-right">Ratio</th>
                <th className="pb-2 text-right hidden sm:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No data available.
                  </td>
                </tr>
              )}
              {data.items.map((item) => (
                <tr
                  key={item.userId}
                  className="border-t border-gray-800 hover:bg-gray-800/40"
                >
                  <td className="py-2 pr-3 text-gray-500">{item.rank}</td>
                  <td className="py-2 pr-3">
                    <Link
                      to={`/private/user/${item.userId}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {item.username}
                    </Link>
                    <span className="ml-2 text-xs text-gray-500">
                      {item.rankName}
                    </span>
                  </td>
                  {showContributed && (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatBytes(Number(item.contributed))}
                    </td>
                  )}
                  {showSpeed && type === 'contributionSpeed' && (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {fmtSpeed(item.contributionSpeed)}
                    </td>
                  )}
                  {showConsumed && (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatBytes(Number(item.consumed))}
                    </td>
                  )}
                  {showSpeed && type === 'consumeSpeed' && (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {fmtSpeed(item.consumeSpeed)}
                    </td>
                  )}
                  {type === 'numContributions' && (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {item.numContributions.toLocaleString()}
                    </td>
                  )}
                  <td
                    className={`py-2 pr-3 text-right tabular-nums font-medium ${ratioColor(
                      item.ratio
                    )}`}
                  >
                    {item.ratio.toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-gray-500 text-xs hidden sm:table-cell">
                    {new Date(item.joinedAt).getFullYear()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopUsersPage;
