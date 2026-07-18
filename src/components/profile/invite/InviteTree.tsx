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
    <tr data-st="row">
      <td className="px-4 py-2.5">
        {/* depth drives indentation so the adjacency tree reads as a hierarchy */}
        <span style={{ paddingLeft: `${node.depth * 1.25}rem` }}>
          <Link
            to={`/user/${node.userId}`}
            data-st={node.disabled ? 'meta' : 'title'}
            className={node.disabled ? 'line-through' : undefined}
          >
            {node.username}
          </Link>
          <UserBadges disabled={node.disabled} isDonor={node.isDonor} />
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span data-st="meta">{node.rankName}</span>
      </td>
      <td data-st-num className="px-4 py-2.5">
        {node.stats ? node.stats.contributed : '—'}
      </td>
      <td data-st-num className="px-4 py-2.5">
        {node.stats ? node.stats.consumed : '—'}
      </td>
      <td data-st-num className="px-4 py-2.5">
        {node.stats ? node.stats.ratio : '—'}
      </td>
    </tr>
    {node.children.map(renderNode)}
  </React.Fragment>
);

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div data-st="panel" className="px-3 py-2">
    <div data-st="meta" className="text-xs">
      {label}
    </div>
    <div data-st="prose" data-st-strong className="text-lg">
      {value}
    </div>
  </div>
);

const Summary = ({ summary }: { summary: InviteTreeSummary }) => (
  <div data-st="panel" className="p-4 mb-6">
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
        <div data-st="meta" className="text-xs mb-1">
          By rank
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.byRank.map((r) => (
            <span
              key={r.rankName}
              data-st="chip"
              className="items-center gap-1"
            >
              {r.rankName}
              <span data-st="meta">{r.count}</span>
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div>
        <div data-st="meta" className="text-xs">
          Tree total (uploaded / downloaded)
        </div>
        <div data-st="prose">
          {summary.total.contributed} / {summary.total.consumed}
        </div>
      </div>
      <div>
        <div data-st="meta" className="text-xs">
          Direct invitees (uploaded / downloaded · ratio)
        </div>
        <div data-st="prose">
          {summary.topLevel.contributed} / {summary.topLevel.consumed} ·{' '}
          {summary.topLevel.ratio}
        </div>
      </div>
    </div>

    {summary.hiddenCount > 0 && (
      <p data-st="meta" className="mt-3 text-xs">
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
      <h2 data-st="prose" data-st-strong className="text-xl mb-6">
        Invite Tree
      </h2>

      {isLoading || !data ? (
        <Spinner />
      ) : (
        <>
          <Summary summary={data.summary} />

          <div data-st="panel">
            <table data-st="grid" className="w-full text-sm">
              <thead data-st="colhead">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Rank</th>
                  <th data-st-num className="px-4 py-3">
                    Uploaded
                  </th>
                  <th data-st-num className="px-4 py-3">
                    Downloaded
                  </th>
                  <th data-st-num className="px-4 py-3">
                    Ratio
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.tree.length ? (
                  data.tree.map(renderNode)
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center">
                      <span data-st="meta">No invitees.</span>
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
