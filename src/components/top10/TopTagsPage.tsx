import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTopTagsQuery,
  type TagsParams
} from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';

type TagType = NonNullable<TagsParams['type']>;
type LimitValue = 10 | 100 | 250;

const TopTagsPage = () => {
  const [type, setType] = useState<TagType>('used');
  const [limit, setLimit] = useState<LimitValue>(10);

  const { data, isLoading, error } = useGetTopTagsQuery({ type, limit });

  const showVotes = type === 'voted';

  return (
    <div className="space-y-4">
      <div data-st="panel" className="p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="tags-view" data-st="meta" className="block mb-1">
            View
          </label>
          <select
            id="tags-view"
            data-st="field"
            value={type}
            onChange={(e) => setType(e.target.value as TagType)}
          >
            <option value="used">Most Used</option>
            <option value="voted">Most Voted</option>
          </select>
        </div>
        <div>
          <label htmlFor="tags-limit" data-st="meta" className="block mb-1">
            Limit
          </label>
          <select
            id="tags-limit"
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
        <p className="text-red-400 text-sm">Failed to load top tags.</p>
      )}
      {data && (
        <div className="overflow-x-auto">
          {/* Columnar data keeps its <table>; the grid/colhead/row variant
              (ADR-0006) carries the token paint. */}
          <table data-st="grid" className="text-sm">
            <thead data-st="colhead">
              <tr>
                <th className="w-8">#</th>
                <th>Tag</th>
                <th data-st-num>Uses</th>
                {showVotes && (
                  <>
                    <th data-st-num>Positive</th>
                    <th data-st-num>Negative</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr data-st="row">
                  <td colSpan={showVotes ? 5 : 3} className="text-center">
                    <span data-st="meta">No tags found.</span>
                  </td>
                </tr>
              )}
              {data.items.map((item) => (
                <tr key={item.tagId} data-st="row">
                  <td>
                    <span data-st="meta">{item.rank}</span>
                  </td>
                  <td>
                    <Link
                      to={`/releases?tags=${encodeURIComponent(item.name)}`}
                      data-st="title"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td data-st-num>{item.uses.toLocaleString()}</td>
                  {showVotes && (
                    <>
                      <td data-st-num>
                        <span className="text-[var(--st-success)]">
                          +{item.positiveVotes.toLocaleString()}
                        </span>
                      </td>
                      <td data-st-num>
                        <span className="text-[var(--st-danger)]">
                          −{item.negativeVotes.toLocaleString()}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopTagsPage;
