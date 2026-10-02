import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Time from '../../layout/Time';
import { avatarSrc, onAvatarError } from '../../../utils/avatar';
import PercentileRankings from '../PercentileRankings';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  formatByteStat,
  showsInviteTreeLink,
  type MyRatioStats,
  type ProfileView
} from './profileView';

type Community = NonNullable<ProfileView['community']>;

const SidebarPanel = ({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) => (
  <div data-st="panel">
    <div data-st="colhead">
      <span>{title}</span>
    </div>
    {children}
  </div>
);

/** A labelled figure in a sidebar grid: the Reputation and Activity tiles. */
const Tile = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
    <div data-st="meta" className="uppercase tracking-wide">
      {label}
    </div>
    <div data-st="prose" data-st-strong className="mt-0.5 text-sm">
      {children}
    </div>
  </div>
);

const AvatarPanel = ({ profile }: { profile: ProfileView }) => (
  <SidebarPanel title="Avatar">
    <div className="p-3 flex justify-center">
      <img
        width={150}
        alt={`${profile.username}'s avatar`}
        className="rounded object-cover w-full"
        src={avatarSrc(
          profile.profile?.avatarSrc ?? profile.avatarSrc,
          profile.profile?.avatar ?? profile.avatar
        )}
        onError={onAvatarError}
      />
    </div>
  </SidebarPanel>
);

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <li>
    <span data-st="meta">{label}:</span> {children}
  </li>
);

/** Joined, last seen, email and class: each shown only when the api sent it. */
const IdentityRows = ({ profile }: { profile: ProfileView }) => (
  <>
    {profile.dateRegistered && (
      <Row label="Joined">
        <Time date={profile.dateRegistered} />
      </Row>
    )}
    {profile.lastSeen && (
      <Row label="Last seen">
        <Time date={profile.lastSeen} />
      </Row>
    )}
    {profile.email && (
      <li className="break-all">
        <span data-st="meta">Email:</span> {profile.email}
      </li>
    )}
    {profile.userRank && (
      <Row label="Class">
        <span style={{ color: profile.userRank.color }}>
          {profile.userRank.badge ? `${profile.userRank.badge} ` : ''}
          {profile.userRank.name}
        </span>
      </Row>
    )}
  </>
);

/** The balance and whether invites are revoked: sent only to who may see it. */
const InviteRow = ({ profile }: { profile: ProfileView }) => {
  if (profile.inviteCount === null || profile.inviteCount === undefined) {
    return null;
  }
  return (
    <Row label="Invites">
      {profile.inviteCount}
      {profile.canInvite === false && (
        <span className="text-[var(--st-warning)]"> (revoked)</span>
      )}
    </Row>
  );
};

/**
 * Who invited the member (#411). The api sends `invitedBy` only to an
 * `invites_manage` viewer, so a `null` hides the row; a `null` inviter means
 * nobody did.
 */
const InvitedByRow = ({ profile }: { profile: ProfileView }) => {
  if (!profile.invitedBy) return null;
  const { inviter } = profile.invitedBy;
  return (
    <Row label="Invited by">
      {inviter ? (
        <Link to={`/user/${inviter.username}`} data-st="control">
          {inviter.username}
        </Link>
      ) : (
        'Nobody'
      )}
    </Row>
  );
};

/** A link to the member's invite tree for an `invites_manage` viewer (#423). */
const InviteTreeRow = ({ profile }: { profile: ProfileView }) => {
  const viewer = useAppSelector(selectCurrentUser);
  if (!showsInviteTreeLink(viewer, profile)) return null;
  return (
    <li>
      <Link to={`/user/${profile.id}/invite-tree`} data-st="control">
        Invite tree →
      </Link>
    </li>
  );
};

const ByteRows = ({ stats }: { stats: ProfileView['stats'] }) => (
  <>
    <Row label="Contributed">{formatByteStat(stats.contributed)}</Row>
    <Row label="Consumed">{formatByteStat(stats.consumed)}</Row>
    <Row label="Ratio">{stats.ratio ?? 'Hidden'}</Row>
    <Row label="Buffer">{formatByteStat(stats.buffer)}</Row>
  </>
);

const OwnRatioRows = ({ stats }: { stats?: MyRatioStats }) => {
  if (!stats) return null;
  return (
    <>
      <Row label="Required ratio">{stats.requiredRatio.toFixed(3)}</Row>
      <Row label="Bracket">{stats.bracket.label}</Row>
      <li>
        <Link to="/ratio" data-st="control">
          Ratio rules →
        </Link>
      </li>
    </>
  );
};

const StatisticsPanel = ({
  profile,
  myRatioStats
}: {
  profile: ProfileView;
  myRatioStats?: MyRatioStats;
}) => (
  <SidebarPanel title="Statistics">
    <ul className="px-3 py-2 space-y-1 text-xs text-[var(--st-text)]">
      <IdentityRows profile={profile} />
      <InviteRow profile={profile} />
      <InvitedByRow profile={profile} />
      <InviteTreeRow profile={profile} />
      {profile.isDonor && <li className="text-pink-400">Donor ♥</li>}
      <ByteRows stats={profile.stats} />
      <OwnRatioRows stats={myRatioStats} />
    </ul>
  </SidebarPanel>
);

const ReputationScore = ({ community }: { community: Community }) => (
  <>
    <div className="px-3 py-2 border-b border-[var(--st-border-subtle)]">
      <div className="text-[var(--st-text-muted)] text-xs uppercase tracking-wide">
        Community Reputation Score
      </div>
      <div
        data-st="prose"
        data-st-strong
        className="mt-0.5 text-lg font-semibold text-[var(--st-link)]"
      >
        {community.reputation.score.toFixed(2)}
      </div>
    </div>
    <ul className="divide-y divide-[var(--st-border-subtle)] text-xs">
      {community.reputation.dimensions.map((dim) => (
        <li
          key={dim.name}
          className="flex items-center justify-between px-3 py-1.5"
        >
          <span className="capitalize text-[var(--st-text-muted)]">
            {dim.name}
          </span>
          <span className="text-[var(--st-text)]">
            {dim.subScore.toFixed(2)}
            <span className="text-[var(--st-text-faint)] ml-1">
              (×wt {dim.weighted.toFixed(2)})
            </span>
          </span>
        </li>
      ))}
    </ul>
  </>
);

// Paranoia-gated (stellar-api #193): null when the viewer's tier hides stats.
const ReputationPanel = ({
  community
}: {
  community: ProfileView['community'];
}) => {
  if (!community) return null;
  return (
    <SidebarPanel title="Reputation">
      <ReputationScore community={community} />
      <div className="grid gap-px bg-[var(--st-border)] grid-cols-2 border-t border-[var(--st-border-subtle)]">
        <Tile label="Friends">{community.friends}</Tile>
        <Tile label="Invites">
          {community.invites.direct} direct / {community.invites.total} total
          <span data-st="meta"> (depth {community.invites.depth})</span>
        </Tile>
      </div>
    </SidebarPanel>
  );
};

const ActivityPanel = ({
  activity
}: {
  activity: ProfileView['activitySummary'];
}) => (
  <SidebarPanel title="Activity">
    <div className="grid gap-px bg-[var(--st-border)] grid-cols-1">
      <Tile label="Contributions">{activity.contributions}</Tile>
      <Tile label="Requests">
        {activity.requestsCreated} created / {activity.requestsFilled} filled
      </Tile>
      <Tile label="Forums">
        {activity.forumTopics} topics / {activity.forumPosts} posts
      </Tile>
      <Tile label="Collections">{activity.collagesStarted} collages</Tile>
      <Tile label="Comments">{activity.comments}</Tile>
    </div>
  </SidebarPanel>
);

const ProfileSidebar = ({
  profile,
  myRatioStats
}: {
  profile: ProfileView;
  myRatioStats?: MyRatioStats;
}) => (
  <div className="w-44 shrink-0 space-y-4">
    <AvatarPanel profile={profile} />
    <StatisticsPanel profile={profile} myRatioStats={myRatioStats} />
    <ReputationPanel community={profile.community} />
    <ActivityPanel activity={profile.activitySummary} />
    <PercentileRankings percentiles={profile.percentiles} />
  </div>
);

export default ProfileSidebar;
