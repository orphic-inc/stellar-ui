import type { Community } from '../../types';
import { Link } from 'react-router-dom';
import CommunityRow from './CommunityRow';
import { COMMUNITY_REQUEST_HREF } from '../staffInbox/ticketTemplates';

interface Props {
  communities: Community[];
}

/** For a member whose community isn't listed (#100). */
export const MissingCommunityHint = () => (
  <p data-st="meta" className="text-sm mt-4">
    Can&apos;t find your community?{' '}
    <Link to={COMMUNITY_REQUEST_HREF} data-st="control">
      Ask staff to create one.
    </Link>
  </p>
);

const CommunitiesTable = ({ communities }: Props) => (
  <table data-st="grid" className="w-full text-sm">
    <thead data-st="colhead">
      <tr>
        <th className="pb-2 pr-3 font-medium" style={{ width: '100%' }}>
          Name
        </th>
        <th className="pb-2 pr-3 font-medium whitespace-nowrap">Type</th>
        <th data-st-num className="pb-2 pr-3 font-medium whitespace-nowrap">
          Releases
        </th>
        <th data-st-num className="pb-2 pr-3 font-medium whitespace-nowrap">
          Contributors
        </th>
        <th data-st-num className="pb-2 font-medium whitespace-nowrap">
          Consumers
        </th>
      </tr>
    </thead>
    <tbody>
      {communities.length > 0 ? (
        communities.map((community) => (
          <CommunityRow key={community.id} community={community} />
        ))
      ) : (
        <tr>
          <td colSpan={5} data-st="meta" className="py-4 text-center">
            No communities to display.
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default CommunitiesTable;
