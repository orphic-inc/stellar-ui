import type { Community } from '../../types';
import CommunityRow from './CommunityRow';

interface Props {
  communities: Community[];
}

const CommunitiesTable = ({ communities }: Props) => (
  <table className="torrent_table cats grouping m_table" id="torrent_table">
    <thead>
      <tr className="colhead">
        <td className="m_th_left" style={{ width: '100%' }}>
          Name
        </td>
        <td>Releases</td>
        <td>Contributors</td>
        <td>Consumers</td>
      </tr>
    </thead>
    <tbody>
      {communities.length > 0 ? (
        communities.map((community) => (
          <CommunityRow key={community.id} community={community} />
        ))
      ) : (
        <tr>
          <td colSpan={4}>No communities to display.</td>
        </tr>
      )}
    </tbody>
  </table>
);

export default CommunitiesTable;
