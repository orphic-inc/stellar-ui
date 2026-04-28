import type { Community } from '../../types';
import CommunityRow from './CommunityRow';

interface Props {
  communities: Community[];
}

const CommunitiesTable = ({ communities }: Props) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-700 text-left text-gray-400">
        <th className="pb-2 pr-3 font-medium" style={{ width: '100%' }}>
          Name
        </th>
        <th className="pb-2 pr-3 font-medium whitespace-nowrap">Releases</th>
        <th className="pb-2 pr-3 font-medium whitespace-nowrap">
          Contributors
        </th>
        <th className="pb-2 font-medium whitespace-nowrap">Consumers</th>
      </tr>
    </thead>
    <tbody>
      {communities.length > 0 ? (
        communities.map((community) => (
          <CommunityRow key={community.id} community={community} />
        ))
      ) : (
        <tr>
          <td colSpan={4} className="py-4 text-gray-500 text-center">
            No communities to display.
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default CommunitiesTable;
