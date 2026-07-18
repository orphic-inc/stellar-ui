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

// Ratio health as status-token hues (success / warning / danger). Applied to a
// span inside the cell — the tr[data-st=row]>td rule would win over a td class.
const ratioColor = (ratio: number) => {
  if (ratio >= 1.0) return 'text-[var(--st-success)]';
  if (ratio >= 0.5) return 'text-[var(--st-warning)]';
  return 'text-[var(--st-danger)]';
};

const fmtSpeed = (bytesPerSec: number) => {
  if (bytesPerSec <= 0) return '—';
  return `${formatBytes(bytesPerSec)}/s`;
};

const TopUsersPage = () => {
  const [type, setType] = useState<UserType>('contributed');
  const [limit, setLimit] = useState<LimitValue>(10);

  const { data, isLoading, error } = useGetTopUsersQuery({ type, limit });

  const showSpeed = type === 'contributionSpeed' || type === 'consumeSpeed';
  const showContributed = type !== 'consumed';
  const showConsumed = type !== 'contributed' && type !== 'numContributions';

  return (
    <div className="space-y-4">
      <div data-st="panel" className="p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="users-metric" data-st="meta" className="block mb-1">
            Metric
          </label>
          <select
            id="users-metric"
            data-st="field"
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
          <label htmlFor="users-limit" data-st="meta" className="block mb-1">
            Limit
          </label>
          <select
            id="users-limit"
            data-st="field"
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
          {/* Columnar data keeps its <table>; the grid/colhead/row variant
              (ADR-0006) carries the token paint. */}
          <table data-st="grid" className="text-sm">
            <thead data-st="colhead">
              <tr>
                <th className="w-8">#</th>
                <th>User</th>
                {showContributed && <th data-st-num>Contributed</th>}
                {showSpeed && type === 'contributionSpeed' && (
                  <th data-st-num>Contrib. Speed</th>
                )}
                {showConsumed && <th data-st-num>Consumed</th>}
                {showSpeed && type === 'consumeSpeed' && (
                  <th data-st-num>Consume Speed</th>
                )}
                {type === 'numContributions' && (
                  <th data-st-num>Contributions</th>
                )}
                <th data-st-num>Ratio</th>
                <th data-st-num className="hidden sm:table-cell">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr data-st="row">
                  <td colSpan={7} className="text-center">
                    <span data-st="meta">No data available.</span>
                  </td>
                </tr>
              )}
              {data.items.map((item) => (
                <tr key={item.userId} data-st="row">
                  <td>
                    <span data-st="meta">{item.rank}</span>
                  </td>
                  <td>
                    <Link to={`/user/${item.userId}`} data-st="title">
                      {item.username}
                    </Link>
                    <span data-st="meta" className="ml-2 text-xs">
                      {item.rankName}
                    </span>
                  </td>
                  {showContributed && (
                    <td data-st-num>{formatBytes(Number(item.contributed))}</td>
                  )}
                  {showSpeed && type === 'contributionSpeed' && (
                    <td data-st-num>{fmtSpeed(item.contributionSpeed)}</td>
                  )}
                  {showConsumed && (
                    <td data-st-num>{formatBytes(Number(item.consumed))}</td>
                  )}
                  {showSpeed && type === 'consumeSpeed' && (
                    <td data-st-num>{fmtSpeed(item.consumeSpeed)}</td>
                  )}
                  {type === 'numContributions' && (
                    <td data-st-num>
                      {item.numContributions.toLocaleString()}
                    </td>
                  )}
                  <td data-st-num>
                    <span className={`font-medium ${ratioColor(item.ratio)}`}>
                      {item.ratio.toFixed(2)}
                    </span>
                  </td>
                  <td data-st-num className="hidden sm:table-cell">
                    <span data-st="meta" className="text-xs">
                      {new Date(item.joinedAt).getFullYear()}
                    </span>
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
