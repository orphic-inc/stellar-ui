import { Link } from 'react-router-dom';
import { useGetContributionsQuery } from '../../../store/services/communityApi';
import Spinner from '../../layout/Spinner';

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
                <td>Collaborators</td>
                <td>Notes</td>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.release.communityId ? (
                      <Link
                        to={`/private/communities/${c.release.communityId}/groups/${c.release.id}`}
                      >
                        {c.release.title}
                      </Link>
                    ) : (
                      c.release.title
                    )}
                  </td>
                  <td>
                    {c.collaborators.length
                      ? c.collaborators.map((a) => a.name).join(', ')
                      : '—'}
                  </td>
                  <td>{c.releaseDescription ?? '—'}</td>
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
