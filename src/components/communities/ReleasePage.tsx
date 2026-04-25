import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import CommentsSection from '../layout/CommentsSection';
import { useGetReleaseByIdQuery } from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';
import DownloadButton from './DownloadButton';

const ReleasePage = () => {
  const { communityId, releaseId } = useParams<{
    communityId: string;
    releaseId: string;
  }>();
  const cId = parseInt(communityId ?? '0');
  const rId = parseInt(releaseId ?? '0');
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const {
    data: release,
    isLoading,
    error
  } = useGetReleaseByIdQuery({
    communityId: cId,
    releaseId: rId
  });

  if (isLoading) return <Spinner />;
  if (error || !release) return <div className="error">Release not found.</div>;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/communities">Communities</Link>
        {' › '}
        <Link to={`/private/communities/${communityId}`}>
          {release.communityId ? 'Community' : 'Community'}
        </Link>
        {' › '}
        <strong>{release.title}</strong>
      </div>

      <div className="box">
        <div className="head colhead_dark">
          {release.artist && <span>{release.artist.name} — </span>}
          {release.title}
          {release.year && <span> ({release.year})</span>}
        </div>
        <div className="pad">
          {release.image && (
            <div className="center" style={{ marginBottom: '1em' }}>
              <img
                src={release.image}
                alt={release.title}
                style={{ maxWidth: 200 }}
              />
            </div>
          )}
          {release.type && (
            <p>
              <strong>Type:</strong> {release.type}
            </p>
          )}
          {release.tags && release.tags.length > 0 && (
            <p>
              <strong>Tags:</strong>{' '}
              {release.tags.map((t) => t.name).join(', ')}
            </p>
          )}
          {release.description && <p>{release.description}</p>}
        </div>
      </div>

      <div className="box">
        <div
          className="head colhead_dark"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Contributions</span>
          <button
            type="button"
            className="brackets btn-link"
            style={{ fontSize: '0.85em' }}
            onClick={() =>
              navigate(
                `/private/communities/${communityId}/releases/${releaseId}/contribute`
              )
            }
          >
            + Add your version
          </button>
        </div>
        {release.contributions && release.contributions.length > 0 ? (
          <table className="m_table">
            <thead>
              <tr className="colhead">
                <td>Contributor</td>
                <td>Format</td>
                <td>Collaborators</td>
                <td>Notes</td>
                <td>Download</td>
              </tr>
            </thead>
            <tbody>
              {release.contributions.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/private/user/${c.user.id}`}>
                      {c.user.username}
                    </Link>
                  </td>
                  <td className="small">{c.type}</td>
                  <td>
                    {c.collaborators.map((a) => a.name).join(', ') || '—'}
                  </td>
                  <td>{c.releaseDescription ?? '—'}</td>
                  <td>
                    <DownloadButton
                      contributionId={c.id}
                      canDownload={user?.canDownload ?? false}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="pad small">
            No contributions yet.{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() =>
                navigate(
                  `/private/communities/${communityId}/releases/${releaseId}/contribute`
                )
              }
            >
              Be the first to contribute a file.
            </button>
          </div>
        )}
      </div>

      <CommentsSection page="release" pageId={rId} />
    </div>
  );
};

export default ReleasePage;
