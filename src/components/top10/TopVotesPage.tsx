import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTopVotesQuery,
  type VotesParams
} from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';

type LimitValue = 25 | 100 | 250;

const selectCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const inputCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const ScoreBar = ({ pct }: { pct: number }) => (
  <div className="flex items-center gap-2">
    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 rounded-full"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
    <span className="text-xs tabular-nums text-gray-400">
      {pct.toFixed(1)}%
    </span>
  </div>
);

const TopVotesPage = () => {
  const [limit, setLimit] = useState<LimitValue>(25);
  const [tagFilter, setTagFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [pending, setPending] = useState({ tags: '', year: '' });

  const params: VotesParams = {
    limit,
    tags: tagFilter || undefined,
    year: yearFilter ? Number(yearFilter) : undefined
  };

  const { data, isLoading, error } = useGetTopVotesQuery(params);

  const applyFilters = () => {
    setTagFilter(pending.tags);
    setYearFilter(pending.year);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label
            htmlFor="votes-limit"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Limit
          </label>
          <select
            id="votes-limit"
            className={selectCls}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) as LimitValue)}
          >
            {[25, 100, 250].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="votes-tags"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Tags (comma-separated)
          </label>
          <input
            id="votes-tags"
            type="text"
            className={inputCls}
            value={pending.tags}
            placeholder="e.g. jazz, blues"
            onChange={(e) =>
              setPending((p) => ({ ...p, tags: e.target.value }))
            }
          />
        </div>
        <div>
          <label
            htmlFor="votes-year"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Year
          </label>
          <input
            id="votes-year"
            type="number"
            className={`${inputCls} w-24`}
            value={pending.year}
            placeholder="2020"
            onChange={(e) =>
              setPending((p) => ({ ...p, year: e.target.value }))
            }
          />
        </div>
        <button
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded"
          onClick={applyFilters}
        >
          Apply
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Ranked by Binomial Proportion Confidence Interval (90% confidence).
        Requires ≥ 3 votes.
      </p>

      {isLoading && <Spinner />}
      {error && (
        <p className="text-red-400 text-sm">Failed to load top votes.</p>
      )}
      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">
                <th className="pb-2 pr-3 w-8">#</th>
                <th className="pb-2 pr-3">Release</th>
                <th className="pb-2 pr-3 text-right">+</th>
                <th className="pb-2 pr-3 text-right">−</th>
                <th className="pb-2 pr-3 text-right">Total</th>
                <th className="pb-2 pr-3 text-right">Score</th>
                <th className="pb-2">Positive</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No voted releases found.
                  </td>
                </tr>
              )}
              {data.items.map((item) => (
                <tr
                  key={item.releaseId}
                  className="border-t border-gray-800 hover:bg-gray-800/40"
                >
                  <td className="py-2 pr-3 text-gray-500">{item.rank}</td>
                  <td className="py-2 pr-3">
                    <Link
                      to={`/private/releases/${item.releaseId}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {item.artistName} – {item.title}
                    </Link>
                    <span className="text-gray-500 ml-2">[{item.year}]</span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-green-400">
                    {item.ups.toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-red-400">
                    {item.downs.toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-400">
                    {item.total.toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums font-medium">
                    {item.score.toFixed(4)}
                  </td>
                  <td className="py-2">
                    <ScoreBar pct={item.positivePercent} />
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

export default TopVotesPage;
