import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useGetMemberInviteTreeQuery } from '../../../store/services/userApi';
import UserBadges from '../../layout/UserBadges';
import Spinner from '../../layout/Spinner';
import type { MemberInviteTreeNode, InviteTreeSummary } from '../../../types';

const renderNode = (node: MemberInviteTreeNode): React.ReactNode => (
  <React.Fragment key={node.userId}>
    <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      <td className="px-4 py-2.5">
        {/* depth drives indentation so the adjacency tree reads as a hierarchy */}
        <span style={{ paddingLeft: `${node.depth * 1.25}rem` }}>
          <Link
            to={`/private/user/${node.userId}`}
            className={
              node.disabled
                ? 'text-gray-500 line-through hover:text-gray-400'
                : 'text-indigo-400 hover:text-indigo-300 transition-colors'
            }
          >
            {node.username}
          </Link>
          <UserBadges disabled={node.disabled} isDonor={node.isDonor} />
        </span>
      </td>
      <td className="px-4 py-2.5 text-gray-400">{node.rankName}</td>
      <td className="px-4 py-2.5 text-right text-gray-300">
        {node.stats ? node.stats.contributed : '—'}
      </td>
      <td className="px-4 py-2.5 text-right text-gray-300">
        {node.stats ? node.stats.consumed : '—'}
      </td>
      <td className="px-4 py-2.5 text-right text-gray-300">
        {node.stats ? node.stats.ratio : '—'}
      </td>
    </tr>
    {node.children.map(renderNode)}
  </React.Fragment>
);

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-gray-800/40 rounded px-3 py-2">
    <div className="text-gray-500 text-xs">{label}</div>
    <div className="text-white text-lg font-semibold">{value}</div>
  </div>
);

const Summary = ({ summary }: { summary: InviteTreeSummary }) => (
  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      <Stat label="Members" value={summary.entries} />
      <Stat label="Branches" value={summary.branches} />
      <Stat label="Depth" value={summary.depth} />
      <Stat label="Donors" value={summary.donorCount} />
      <Stat label="Disabled" value={summary.disabledCount} />
      <Stat label="Tree ratio" value={summary.total.ratio} />
    </div>

    {summary.byRank.length > 0 && (
      <div className="mt-4">
        <div className="text-gray-500 text-xs mb-1">By rank</div>
        <div className="flex flex-wrap gap-2">
          {summary.byRank.map((r) => (
            <span
              key={r.rankName}
              className="inline-flex items-center gap-1 bg-gray-800/60 rounded px-2 py-1 text-xs text-gray-300"
            >
              {r.rankName}
              <span className="text-gray-500">{r.count}</span>
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div>
        <div className="text-gray-500 text-xs">
          Tree total (uploaded / downloaded)
        </div>
        <div className="text-gray-300">
          {summary.total.contributed} / {summary.total.consumed}
        </div>
      </div>
      <div>
        <div className="text-gray-500 text-xs">
          Direct invitees (uploaded / downloaded · ratio)
        </div>
        <div className="text-gray-300">
          {summary.topLevel.contributed} / {summary.topLevel.consumed} ·{' '}
          {summary.topLevel.ratio}
        </div>
      </div>
    </div>

    {summary.hiddenCount > 0 && (
      <p className="mt-3 text-gray-500 text-xs">
        {summary.hiddenCount} member{summary.hiddenCount === 1 ? '' : 's'}{' '}
        hidden from your view.
      </p>
    )}
  </div>
);

// `embedded` drops the full-page wrapper so the tree can sit inline above the
// invite form (the signed-in user's own tree, no :id param).
const InviteTree = ({ embedded = false }: { embedded?: boolean }) => {
  // Defaults to the signed-in user; an `:id` param yields the per-member view.
  const { id } = useParams<{ id?: string }>();
  const currentUser = useSelector(selectCurrentUser);
  const targetId = id ? Number(id) : currentUser?.id;

  const { data, isLoading } = useGetMemberInviteTreeQuery(targetId as number, {
    skip: !targetId
  });

  return (
    <div className={embedded ? 'mb-6' : 'max-w-4xl mx-auto px-4 py-6'}>
      <h2 className="text-xl font-semibold text-white mb-6">Invite Tree</h2>

      {isLoading || !data ? (
        <Spinner />
      ) : (
        <>
          <Summary summary={data.summary} />

          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400 text-xs">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium text-right">Uploaded</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Downloaded
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {data.tree.length ? (
                  data.tree.map(renderNode)
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No invitees.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default InviteTree;
