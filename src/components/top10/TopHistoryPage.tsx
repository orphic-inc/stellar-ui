import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetTop10HistoryQuery } from '../../store/services/top10Api';
import Spinner from '../layout/Spinner';

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
      <div data-st="panel" className="p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="history-type" data-st="meta" className="block mb-1">
            Snapshot Type
          </label>
          <select
            id="history-type"
            data-st="field"
            value={type}
            onChange={(e) => setType(e.target.value as 'Daily' | 'Weekly')}
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
          </select>
        </div>
        <div>
          <label htmlFor="history-date" data-st="meta" className="block mb-1">
            Date
          </label>
          <input
            id="history-date"
            type="date"
            data-st="field"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {(isLoading || isFetching) && <Spinner />}

      {error && (
        <div data-st="panel" className="p-6 text-center">
          <span data-st="prose" data-st-muted>
            No snapshot found for {date} ({type}).
          </span>
        </div>
      )}

      {data && !isFetching && (
        <div data-st="panel">
          {/* Section header bar carrying a content title (the snapshot label),
              so colhead -title (not the uppercase structural variant). */}
          <div data-st="colhead" data-st-title>
            <span>{data.type} snapshot</span>
            <span data-st="meta">
              {new Date(data.date).toLocaleDateString()}
            </span>
          </div>
          {/* Columnar data keeps its <table>; the grid/colhead/row variant
              (ADR-0006) carries the token paint. */}
          <table data-st="grid" className="text-sm">
            <thead data-st="colhead">
              <tr>
                <th className="w-8">#</th>
                <th>Release</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr key={entry.rank} data-st="row">
                  <td>
                    <span data-st="meta">{entry.rank}</span>
                  </td>
                  <td>
                    {entry.releaseId && !entry.deleted ? (
                      <Link to={`/releases/${entry.releaseId}`} data-st="title">
                        {entry.releaseTitle}
                      </Link>
                    ) : (
                      <span data-st="meta">
                        {entry.releaseTitle}{' '}
                        <span className="text-xs italic">(deleted)</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <span data-st="meta" className="text-xs">
                      {entry.tagString}
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

export default TopHistoryPage;
