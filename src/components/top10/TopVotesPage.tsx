import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTopVotesQuery,
  type VotesParams
} from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';

type LimitValue = 25 | 100 | 250;

// Inline positive-percent meter. Not the row-background `bar` Role (that is an
// absolute full-row weight fill); this is a small standalone widget, so its
// leaf colors migrate to tokens — success hue for the positive fill.
const ScoreBar = ({ pct }: { pct: number }) => (
  <div className="flex items-center gap-2">
    <div className="w-20 h-1.5 bg-[var(--st-weight-track)] rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--st-success)] rounded-full"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
    <span data-st="meta" className="text-xs tabular-nums">
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
      <div data-st="panel" className="p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="votes-limit" data-st="meta" className="block mb-1">
            Limit
          </label>
          <select
            id="votes-limit"
            data-st="field"
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
          <label htmlFor="votes-tags" data-st="meta" className="block mb-1">
            Tags (comma-separated)
          </label>
          <input
            id="votes-tags"
            type="text"
            data-st="field"
            value={pending.tags}
            placeholder="e.g. jazz, blues"
            onChange={(e) =>
              setPending((p) => ({ ...p, tags: e.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="votes-year" data-st="meta" className="block mb-1">
            Year
          </label>
          <input
            id="votes-year"
            type="number"
            data-st="field"
            className="w-24"
            value={pending.year}
            placeholder="2020"
            onChange={(e) =>
              setPending((p) => ({ ...p, year: e.target.value }))
            }
          />
        </div>
        <button data-st="control" data-st-primary onClick={applyFilters}>
          Apply
        </button>
      </div>

      <p data-st="prose" data-st-muted className="text-xs">
        Ranked by Binomial Proportion Confidence Interval (90% confidence).
        Requires ≥ 3 votes.
      </p>

      {isLoading && <Spinner />}
      {error && (
        <p className="text-red-400 text-sm">Failed to load top votes.</p>
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
                <th data-st-num>+</th>
                <th data-st-num>−</th>
                <th data-st-num>Total</th>
                <th data-st-num>Score</th>
                <th>Positive</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr data-st="row">
                  <td colSpan={7} className="text-center">
                    <span data-st="meta">No voted releases found.</span>
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
                  </td>
                  <td data-st-num>
                    <span className="text-[var(--st-success)]">
                      {item.ups.toLocaleString()}
                    </span>
                  </td>
                  <td data-st-num>
                    <span className="text-[var(--st-danger)]">
                      {item.downs.toLocaleString()}
                    </span>
                  </td>
                  <td data-st-num>{item.total.toLocaleString()}</td>
                  <td data-st-num className="font-medium">
                    {item.score.toFixed(4)}
                  </td>
                  <td>
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
