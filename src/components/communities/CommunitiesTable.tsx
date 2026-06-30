import type { Community } from '../../types';
import CommunityRow from './CommunityRow';

interface Props {
  communities: Community[];
}

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
