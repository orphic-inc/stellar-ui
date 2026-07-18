import { Link } from 'react-router-dom';
import { useGetContributionsQuery } from '../../store/services/communityApi';
import { formatSize } from '../../utils';
import Spinner from '../layout/Spinner';

const ContributionsPage = () => {
  const { data, isLoading, error } = useGetContributionsQuery();

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div className="p-4 text-red-400">Failed to load contributions.</div>
    );

  const contributions = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          My Contributions
        </h2>
        <Link to="/contribute" data-st="control" data-st-primary>
          + Upload
        </Link>
      </div>

      {contributions.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          No contributions yet.{' '}
          <Link to="/contribute" data-st="control">
            Upload something!
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          {/* Columnar data keeps its <table>; the grid/colhead/row variant
              (ADR-0006) carries the token paint. */}
          <table data-st="grid" className="text-sm">
            <thead data-st="colhead">
              <tr>
                <th>Release</th>
                <th>Format</th>
                <th data-st-num>Size</th>
                <th>Collaborators</th>
                <th>Notes</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id} data-st="row">
                  <td>
                    {c.release.communityId ? (
                      <Link
                        to={`/communities/${c.release.communityId}/releases/${c.release.id}`}
                        data-st="title"
                      >
                        {c.release.title}
                      </Link>
                    ) : (
                      <span data-st="prose" data-st-strong>
                        {c.release.title}
                      </span>
                    )}
                  </td>
                  <td>
                    <span data-st="meta" className="text-xs">
                      {c.type}
                    </span>
                  </td>
                  <td data-st-num className="whitespace-nowrap">
                    {c.sizeInBytes ? formatSize(Number(c.sizeInBytes)) : '—'}
                  </td>
                  <td>
                    <span data-st="meta">
                      {c.collaborators.length
                        ? c.collaborators.map((a) => a.name).join(', ')
                        : '—'}
                    </span>
                  </td>
                  <td>
                    <span data-st="meta">{c.releaseDescription ?? '—'}</span>
                  </td>
                  <td>
                    <a
                      href={c.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-st="control"
                      className="text-xs"
                    >
                      Download
                    </a>
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

export default ContributionsPage;
