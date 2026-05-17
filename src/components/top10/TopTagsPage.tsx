import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTopTagsQuery,
  type TagsParams
} from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';

type TagType = NonNullable<TagsParams['type']>;
type LimitValue = 10 | 100 | 250;

const selectCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const TopTagsPage = () => {
  const [type, setType] = useState<TagType>('used');
  const [limit, setLimit] = useState<LimitValue>(10);

  const { data, isLoading, error } = useGetTopTagsQuery({ type, limit });

  const showVotes = type === 'voted';

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label
            htmlFor="tags-view"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            View
          </label>
          <select
            id="tags-view"
            className={selectCls}
            value={type}
            onChange={(e) => setType(e.target.value as TagType)}
          >
            <option value="used">Most Used</option>
            <option value="voted">Most Voted</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="tags-limit"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Limit
          </label>
          <select
            id="tags-limit"
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
        <p className="text-red-400 text-sm">Failed to load top tags.</p>
      )}
      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">
                <th className="pb-2 pr-3 w-8">#</th>
                <th className="pb-2 pr-3">Tag</th>
                <th className="pb-2 pr-3 text-right">Uses</th>
                {showVotes && (
                  <>
                    <th className="pb-2 pr-3 text-right text-green-500">
                      Positive
                    </th>
                    <th className="pb-2 text-right text-red-500">Negative</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td
                    colSpan={showVotes ? 5 : 3}
                    className="py-8 text-center text-gray-500"
                  >
                    No tags found.
                  </td>
                </tr>
              )}
              {data.items.map((item) => (
                <tr
                  key={item.tagId}
                  className="border-t border-gray-800 hover:bg-gray-800/40"
                >
                  <td className="py-2 pr-3 text-gray-500">{item.rank}</td>
                  <td className="py-2 pr-3">
                    <Link
                      to={`/private/releases?tags=${encodeURIComponent(
                        item.name
                      )}`}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {item.uses.toLocaleString()}
                  </td>
                  {showVotes && (
                    <>
                      <td className="py-2 pr-3 text-right tabular-nums text-green-400">
                        +{item.positiveVotes.toLocaleString()}
                      </td>
                      <td className="py-2 text-right tabular-nums text-red-400">
                        −{item.negativeVotes.toLocaleString()}
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
