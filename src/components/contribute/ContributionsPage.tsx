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
        <h2 className="text-xl font-semibold text-gray-100">
          My Contributions
        </h2>
        <Link
          to="/private/contribute"
          className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded"
        >
          + Upload
        </Link>
      </div>

      {contributions.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No contributions yet.{' '}
          <Link
            to="/private/contribute"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Upload something!
          </Link>
        </p>
      ) : (
        <div className="rounded border border-gray-700 bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="px-4 py-2 font-medium">Release</th>
                <th className="px-4 py-2 font-medium">Format</th>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Collaborators</th>
                <th className="px-4 py-2 font-medium">Notes</th>
                <th className="px-4 py-2 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-800 hover:bg-gray-800/30"
                >
                  <td className="px-4 py-2">
                    {c.release.communityId ? (
                      <Link
                        to={`/private/communities/${c.release.communityId}/releases/${c.release.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {c.release.title}
                      </Link>
                    ) : (
                      <span className="text-gray-300">{c.release.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{c.type}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                    {c.sizeInBytes ? formatSize(Number(c.sizeInBytes)) : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-400">
                    {c.collaborators.length
                      ? c.collaborators.map((a) => a.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-400">
                    {c.releaseDescription ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={c.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-xs"
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
