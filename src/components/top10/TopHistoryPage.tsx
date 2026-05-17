import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetTop10HistoryQuery } from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';

const selectCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const inputCls =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const today = () => new Date().toISOString().slice(0, 10);

const TopHistoryPage = () => {
  const [type, setType] = useState<'Daily' | 'Weekly'>('Daily');
  const [date, setDate] = useState(today());

  const { data, isLoading, error, isFetching } = useGetTop10HistoryQuery({
    type,
    date
  });

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label
            htmlFor="history-type"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Snapshot Type
          </label>
          <select
            id="history-type"
            className={selectCls}
            value={type}
            onChange={(e) => setType(e.target.value as 'Daily' | 'Weekly')}
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="history-date"
            className="block text-xs font-medium text-gray-400 mb-1"
          >
            Date
          </label>
          <input
            id="history-date"
            type="date"
            className={inputCls}
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {(isLoading || isFetching) && <Spinner />}

      {error && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
          No snapshot found for {date} ({type}).
        </div>
      )}

      {data && !isFetching && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200">
              {data.type} snapshot
            </span>
            <span className="text-xs text-gray-500">
              {new Date(data.date).toLocaleDateString()}
            </span>
          </div>
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">
                <th className="px-4 py-2 w-8">#</th>
                <th className="px-4 py-2">Release</th>
                <th className="px-4 py-2">Tags</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr
                  key={entry.rank}
                  className="border-t border-gray-800 hover:bg-gray-800/40"
                >
                  <td className="px-4 py-2 text-gray-500">{entry.rank}</td>
                  <td className="px-4 py-2">
                    {entry.releaseId && !entry.deleted ? (
                      <Link
                        to={`/private/releases/${entry.releaseId}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {entry.releaseTitle}
                      </Link>
                    ) : (
                      <span className="text-gray-500">
                        {entry.releaseTitle}{' '}
                        <span className="text-xs italic">(deleted)</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {entry.tagString}
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

export default TopHistoryPage;
