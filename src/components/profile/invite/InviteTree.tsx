import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useGetProfileByUserIdQuery } from '../../../store/services/profileApi';
import Spinner from '../../layout/Spinner';
import Time from '../../layout/Time';
import type { InviteNode } from '../../../types';

const renderNode = (node: InviteNode): React.ReactNode => (
  <React.Fragment key={node.id}>
    <tr>
      <td>{node.username}</td>
      <td>{node.email}</td>
      <td>{node.joinedAt ? <Time date={node.joinedAt} /> : '—'}</td>
      <td>{node.lastSeen ? <Time date={node.lastSeen} /> : '—'}</td>
      <td>{node.uploaded}</td>
      <td>{node.downloaded}</td>
      <td>{node.ratio}</td>
    </tr>
    {node.children?.map(renderNode)}
  </React.Fragment>
);

import React from 'react';

const InviteTree = () => {
  const user = useSelector(selectCurrentUser);
  const { data: profile, isLoading } = useGetProfileByUserIdQuery(
    user?.id ?? 0,
    { skip: !user?.id }
  );

  return (
    <div className="thin">
      <h3>Invite Tree</h3>
      <div className="box pad">
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="invite_table m_table" width="100%">
            <thead>
              <tr className="colhead">
                <td className="m_th_left">Username</td>
                <td>Email</td>
                <td>Joined</td>
                <td>Last Seen</td>
                <td className="m_th_right">Uploaded</td>
                <td className="m_th_right">Downloaded</td>
                <td className="m_th_right">Ratio</td>
              </tr>
            </thead>
            <tbody>
              {profile?.inviteTree?.length ? (
                profile.inviteTree.map(renderNode)
              ) : (
                <tr>
                  <td colSpan={7}>No invitees.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InviteTree;
