import { Link } from 'react-router-dom';
import type { Community } from '../../types';

interface Props {
  community: Community;
}

const CommunityRow = ({ community }: Props) => (
  <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
    <td className="py-3 pr-3">
      <Link
        to={`/private/communities/${community.id}`}
        className="text-indigo-400 hover:text-indigo-300 font-medium"
      >
        {community.name}
      </Link>
      {community.description && (
        <div className="text-xs text-gray-500 mt-0.5">
          {community.description}
        </div>
      )}
    </td>
    <td className="py-3 pr-3 text-gray-400 text-right">
      {community._count?.releases ?? 0}
    </td>
    <td className="py-3 pr-3 text-gray-400 text-right">
      {community._count?.contributors ?? 0}
    </td>
    <td className="py-3 text-gray-400 text-right">
      {community._count?.consumers ?? 0}
    </td>
  </tr>
);

export default CommunityRow;
