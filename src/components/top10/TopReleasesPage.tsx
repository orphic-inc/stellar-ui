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

const TopReleasesPage = () => {
  const [type, setType] = useState<NonNullable<ReleaseType>>('overall');
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
      <div data-st="panel" className="p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="releases-type" data-st="meta" className="block mb-1">
            Period / Type
          </label>
          <select
            id="releases-type"
            data-st="field"
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
          <label htmlFor="releases-limit" data-st="meta" className="block mb-1">
            Limit
          </label>
          <select
            id="releases-limit"
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

        <div>
          <label
            htmlFor="releases-format"
            data-st="meta"
            className="block mb-1"
          >
            Format
          </label>
          <select
            id="releases-format"
            data-st="field"
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
            data-st="meta"
            className="block mb-1"
          >
            Exclude Tags (comma-separated)
          </label>
          <div className="flex gap-2">
            <input
              id="releases-exclude-tags"
              type="text"
              data-st="field"
              className="flex-1"
              value={pendingExclude}
              placeholder="e.g. pop, rock"
              onChange={(e) => setPendingExclude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setExcludeTags(pendingExclude);
              }}
            />
            <button
              data-st="control"
              data-st-primary
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
          {/* Columnar data keeps its <table>; the grid/colhead/row variant
              (ADR-0006) carries the token paint. */}
          <table data-st="grid" className="text-sm">
            <thead data-st="colhead">
              <tr>
                <th className="w-8">#</th>
                <th>Release</th>
                <th data-st-num>Consumers</th>
                <th data-st-num>Data</th>
                <th data-st-num>Contributions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr data-st="row">
                  <td colSpan={5} className="text-center">
                    <span data-st="meta">No data for this period.</span>
                  </td>
                </tr>
              )}
              {data.items.map((item) => (
                <tr key={item.releaseId} data-st="row">
                  <td>
                    <span data-st="meta">{item.rank}</span>
                  </td>
                  <td>
                    <Link
                      to={`/private/releases/${item.releaseId}`}
                      data-st="title"
                    >
                      {item.artistName} – {item.title}
                    </Link>
                    <span data-st="meta" className="ml-2">
                      [{item.year}]
                    </span>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.tags.map((t) => (
                          <span key={t.id} data-st="chip">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-st-num>{item.consumerCount.toLocaleString()}</td>
                  <td data-st-num>
                    {formatBytes(Number(item.totalBytesConsumed))}
                  </td>
                  <td data-st-num>{item.contributionCount}</td>
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
