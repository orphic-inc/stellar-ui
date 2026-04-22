import { Link, useParams } from 'react-router-dom';
import { useGetReleaseByIdQuery } from '../../../store/services/communityApi';
import Spinner from '../../layout/Spinner';

const CommunityGroupPage = () => {
  const { communityId, groupId } = useParams<{
    communityId: string;
    groupId: string;
  }>();
  const cId = parseInt(communityId!);
  const gId = parseInt(groupId!);

  const { data: release, isLoading, error } = useGetReleaseByIdQuery({
    communityId: cId,
    groupId: gId
  });

  if (isLoading) return <Spinner />;
  if (error || !release)
    return <div className="error">Release not found.</div>;

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
          {release.artist && (
            <span>{release.artist.name} — </span>
          )}
          {release.title}
          {release.year && <span> ({release.year})</span>}
        </div>
        <div className="pad">
          {release.image && (
            <div className="center" style={{ marginBottom: '1em' }}>
              <img src={release.image} alt={release.title} style={{ maxWidth: 200 }} />
            </div>
          )}
          {release.type && (
            <p><strong>Type:</strong> {release.type}</p>
          )}
          {release.tags && release.tags.length > 0 && (
            <p>
              <strong>Tags:</strong>{' '}
              {release.tags.map((t) => t.name).join(', ')}
            </p>
          )}
          {release.description && (
            <p>{release.description}</p>
          )}
        </div>
      </div>

      {release.contributions && release.contributions.length > 0 && (
        <div className="box">
          <div className="head colhead_dark">Contributions</div>
          <table className="m_table">
            <thead>
              <tr className="colhead">
                <td>Contributor</td>
                <td>Collaborators</td>
                <td>Notes</td>
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
                  <td>
                    {c.collaborators.map((a) => a.name).join(', ') || '—'}
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

export default CommunityGroupPage;
