import { Link } from 'react-router-dom';
import type { Community } from '../../types';
import { Badge } from '../ui';

interface Props {
  community: Community;
}

const CommunityRow = ({ community }: Props) => (
  <tr data-st="row" className="transition-colors">
    <td className="py-3 pr-3">
      <Link
        to={`/private/communities/${community.id}`}
        data-st="title"
        className="font-medium"
      >
        {community.name}
      </Link>
      {community.description && (
        <div data-st="meta" className="text-xs mt-0.5">
          {community.description}
        </div>
      )}
    </td>
    <td className="py-3 pr-3 whitespace-nowrap">
      {community.type ? (
        <Badge>{community.type}</Badge>
      ) : (
        <span data-st="meta" className="text-xs">
          —
        </span>
      )}
    </td>
    <td data-st-num className="py-3 pr-3">
      {community._count?.releases ?? 0}
    </td>
    <td data-st-num className="py-3 pr-3">
      {community._count?.contributors ?? 0}
    </td>
    <td data-st-num className="py-3">
      {community._count?.consumers ?? 0}
    </td>
  </tr>
);

export default CommunityRow;
