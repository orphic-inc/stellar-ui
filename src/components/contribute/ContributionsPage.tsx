import { Link } from 'react-router-dom';
import { useGetContributionsQuery } from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';

const ContributionsPage = () => {
  const { data, isLoading, error } = useGetContributionsQuery();

  if (isLoading) return <Spinner />;
  if (error) return <div className="error">Failed to load contributions.</div>;

  const contributions = data?.data ?? [];

  return (
    <div className="thin">
      <h2>My Contributions</h2>
      {!contributions.length ? (
        <div className="box pad">
          <p>
            No contributions yet.{' '}
            <Link to="/private/contribute">Upload something!</Link>
          </p>
        </div>
      ) : (
        <div className="box">
          <table className="m_table">
            <thead>
              <tr className="colhead">
                <td>Release</td>
                <td>Format</td>
                <td>Collaborators</td>
                <td>Notes</td>
                <td>Download</td>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.release.communityId ? (
                      <Link
                        to={`/private/communities/${c.release.communityId}/releases/${c.release.id}`}
                      >
                        {c.release.title}
                      </Link>
                    ) : (
                      c.release.title
                    )}
                  </td>
                  <td className="small">{c.type}</td>
                  <td>
                    {c.collaborators.length
                      ? c.collaborators.map((a) => a.name).join(', ')
                      : '—'}
                  </td>
                  <td>{c.releaseDescription ?? '—'}</td>
                  <td>
                    <a
                      href={c.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brackets"
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
