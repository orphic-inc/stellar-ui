import { Link } from 'react-router-dom';
import type { Community } from '../../types';

interface Props {
  community: Community;
}

const CommunityRow = ({ community }: Props) => (
  <tr className="torrent">
    <td className="td_info big_info">
      <Link
        to={`/private/communities/${community.id}`}
        className="tooltip"
        dir="ltr"
      >
        {community.name}
      </Link>
      {community.description && (
        <div className="forum-description">{community.description}</div>
      )}
    </td>
    <td className="number_column">{community._count?.releases ?? 0}</td>
    <td className="number_column">{community._count?.contributors ?? 0}</td>
    <td className="number_column">{community._count?.consumers ?? 0}</td>
  </tr>
);

export default CommunityRow;
