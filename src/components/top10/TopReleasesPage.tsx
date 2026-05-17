import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTopReleasesQuery,
  type ReleasesParams
} from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';
import { formatBytes } from '../../utils';

type ReleaseType = ReleasesParams['type'];
type LimitValue = 10 | 100 | 250;

const TYPE_LABELS: Record<NonNullable<ReleaseType>, string> = {
  day: 'Past Day',
  week: 'Past Week',
  month: 'Past Month',
  year: 'Past Year',
  overall: 'All Time',
  consumed: 'Most Consumed',
  contributed: 'Most Contributed'
};

const FORMAT_OPTIONS = [
  '',
  'mp3',
  'flac',
  'wav',
  'ogg',
  'aac',
  'm4a',
  'mp4',
  'mkv',
  'pdf',
  'epub'
];

const selectCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const TopReleasesPage = () => {
  const [type, setType] = useState<NonNullable<ReleaseType>>('day');
  const [limit, setLimit] = useState<LimitValue>(10);
  const [excludeTags, setExcludeTags] = useState('');
  const [format, setFormat] = useState('');
  const [pendingExclude, setPendingExclude] = useState('');

  const { data, isLoading, error } = useGetTopReleasesQuery({
    type,
    limit,
    excludeTags: excludeTags || undefined,
    format: format || undefined
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label
            htmlFor="releases-type"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Period / Type
          </label>
          <select
            id="releases-type"
            className={selectCls}
            value={type}
            onChange={(e) =>
              setType(e.target.value as NonNullable<ReleaseType>)
            }
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
            htmlFor="releases-limit"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Limit
          </label>
          <select
            id="releases-limit"
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

        <div>
          <label
            htmlFor="releases-format"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Format
          </label>
          <select
            id="releases-format"
            className={selectCls}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {FORMAT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v || 'Any'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-48">
          <label
            htmlFor="releases-exclude-tags"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Exclude Tags (comma-separated)
          </label>
          <div className="flex gap-2">
            <input
              id="releases-exclude-tags"
              type="text"
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={pendingExclude}
              placeholder="e.g. pop, rock"
              onChange={(e) => setPendingExclude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setExcludeTags(pendingExclude);
              }}
            />
            <button
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded"
              onClick={() => setExcludeTags(pendingExclude)}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading && <Spinner />}
      {error && (
        <p className="text-red-400 text-sm">Failed to load top releases.</p>
      )}
      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">
                <th className="pb-2 pr-3 w-8">#</th>
                <th className="pb-2 pr-3">Release</th>
                <th className="pb-2 pr-3 text-right">Consumers</th>
                <th className="pb-2 pr-3 text-right">Data</th>
                <th className="pb-2 text-right">Contributions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No data for this period.
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
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.tags.map((t) => (
                          <span
                            key={t.id}
                            className="text-[10px] bg-gray-700 text-gray-400 rounded px-1.5 py-0.5"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {item.consumerCount.toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatBytes(Number(item.totalBytesConsumed))}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {item.contributionCount}
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

export default TopReleasesPage;
