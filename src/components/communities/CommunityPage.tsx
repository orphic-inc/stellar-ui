import { Link, useParams } from 'react-router-dom';
import {
  useGetCommunityByIdQuery,
  useGetReleasesByCommunityQuery
} from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';

const CommunityPage = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const id = parseInt(communityId ?? '0');

  const {
    data: community,
    isLoading: loadingCommunity,
    error
  } = useGetCommunityByIdQuery(id);
  const { data: releases, isLoading: loadingReleases } =
    useGetReleasesByCommunityQuery(id);

  if (loadingCommunity) return <Spinner />;
  if (error || !community)
    return <div className="error">Community not found.</div>;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/communities">Communities</Link>
        {' › '}
        <strong>{community.name}</strong>
      </div>

      <div className="box">
        <div className="head colhead_dark">{community.name}</div>
        {community.description && (
          <div className="pad">{community.description}</div>
        )}
      </div>

      <div className="box">
        <div className="head colhead_dark">Releases</div>
        {loadingReleases ? (
          <Spinner />
        ) : (
          <table className="m_table">
            <thead>
              <tr className="colhead">
                <td>Title</td>
                <td>Year</td>
                <td>Type</td>
              </tr>
            </thead>
            <tbody>
              {releases?.data && releases.data.length > 0 ? (
                releases.data.map((release) => (
                  <tr key={release.id}>
                    <td>
                      <Link
                        to={`/private/communities/${communityId}/groups/${release.id}`}
                      >
                        {release.title}
                      </Link>
                    </td>
                    <td>{release.year}</td>
                    <td>{release.type}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No releases yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
