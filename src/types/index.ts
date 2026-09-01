import type { components } from './api';

// ─── Auth / User ────────────────────────────────────────────────────────────

export type UserRank = components['schemas']['UserRank'];
export type AuthUserRank = components['schemas']['AuthUser']['userRank'];
export type AuthUser = components['schemas']['AuthUser'];
export type PublicUser = components['schemas']['PublicUser'];

export type ArtistHistory = components['schemas']['ArtistHistory'];

// ─── Alert ──────────────────────────────────────────────────────────────────

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

export interface Alert {
  id: string;
  msg: string;
  alertType: AlertType;
}

// ─── Forum ───────────────────────────────────────────────────────────────────

export type ForumCategory = components['schemas']['ForumCategory'];
export type Forum = components['schemas']['Forum'];
export type ForumTopic = components['schemas']['ForumTopic'];
export type ForumPost = components['schemas']['ForumPost'];
export type ForumPostEdit = components['schemas']['ForumPostEdit'];
export type ForumPollVote = components['schemas']['ForumPollVote'];
export type ForumPoll = components['schemas']['ForumPoll'];

// ─── Community ───────────────────────────────────────────────────────────────

export type CommunityType =
  | 'Music'
  | 'Applications'
  | 'EBooks'
  | 'ELearningVideos'
  | 'Audiobooks'
  | 'Comedy'
  | 'Comics';

export type RegistrationStatus = 'open' | 'invite' | 'closed';

export type Community = components['schemas']['Community'];
export type ReleaseContribution = components['schemas']['ReleaseContribution'];
export type Contribution = components['schemas']['Contribution'];
export type ReleaseContributionDetail =
  components['schemas']['ReleaseContributionDetail'];
export type ReleaseFileQuality = components['schemas']['ReleaseFileQuality'];
export type EditionIdentity = components['schemas']['EditionIdentity'];
export type Release = components['schemas']['Release'];

// ─── Profile ─────────────────────────────────────────────────────────────────

export type InviteNode = components['schemas']['InviteNode'];
export type MemberInviteTreeNode =
  components['schemas']['MemberInviteTreeNode'];
export type InviteTreeSummary = components['schemas']['InviteTreeSummary'];

// ─── Misc ────────────────────────────────────────────────────────────────────

export type Announcement = components['schemas']['Announcement'];
export type BlogPost = components['schemas']['BlogPost'];
export type AnnouncementsResponse =
  components['schemas']['AnnouncementsResponse'];
export type Artist = components['schemas']['Artist'];

export interface Collaborator {
  artist: string;
  importance: string;
}

// ─── Requests & Bounty ──────────────────────────────────────────────────────

// The status values the requests page offers as a FILTER. Deliberately narrower
// than the response enum, which also carries `deleted` — nothing writes that
// value and no list can return it (the list filters on `deletedAt`). ADR-0010
// exempts query-argument types: they are legitimately the UI's own.
//
// The request RESPONSE shapes that used to live here — RequestItem,
// RequestBounty, RequestsListResponse — are gone: they are read off the
// contract in store/services/requestApi.ts (#277).
export type RequestStatus = 'open' | 'filled';

// ─── Ratio ───────────────────────────────────────────────────────────────────

export type RatioPolicyStatus = 'OK' | 'WATCH' | 'DOWNLOAD_DISABLED';

export interface PolicyStateView {
  status: RatioPolicyStatus;
  watchStartedAt: string | null;
  watchExpiresAt: string | null;
  downloadDisabledAt: string | null;
  lastEvaluatedAt: string;
}

export interface RatioBracket {
  label: string;
  maxRequired: number;
  minRequired: number;
}

export interface RatioStats {
  ratio: number;
  contributed: string;
  consumed: string;
  bracket: RatioBracket;
  eligibleContributionBytes: string;
  contributionCoverage: number;
  requiredRatio: number;
  meetsRequirement: boolean;
  policy: PolicyStateView;
}

// ─── Link health ─────────────────────────────────────────────────────────────

export type LinkHealthStatus = 'UNKNOWN' | 'PASS' | 'WARN' | 'FAIL';

export interface ContributionWithHealth {
  id: number;
  userId: number;
  releaseId: number;
  contributorId: number;
  releaseDescription: string | null;
  sizeInBytes: number | null;
  approvedAccountingBytes: string | null;
  linkStatus: LinkHealthStatus;
  linkCheckedAt: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; username: string };
  collaborators?: Array<{ id: number; name: string }>;
}

// ─── Downloads ───────────────────────────────────────────────────────────────

export type DownloadGrantStatus = 'COMPLETED' | 'REVERSED';

export interface DownloadGrant {
  grantId: number;
  downloadUrl: string;
  amountBytes: string;
  status: DownloadGrantStatus;
  createdAt: string;
}

// ─── Site stats ─────────────────────────────────────────────────────────────

export type SiteStats = components['schemas']['SiteStats'];

// ─── Collage ─────────────────────────────────────────────────────────────────
//
// The collage RESPONSE shapes that used to live here — Collage, CollageEntry,
// CollageEntryRelease, CollageCounts, CollageListResponse — are gone. They are
// read off the contract in store/services/collageApi.ts (#277), which also
// distinguishes the list shape from the detail shape; this file's single flat
// interface could not.
//
// CollageOrderBy stays: it is the browse page's sort control, a query argument,
// which ADR-0010 leaves to the UI.

export type CollageOrderBy =
  'createdAt' | 'updatedAt' | 'name' | 'numEntries' | 'numSubscribers';

// ─── Redux state types ───────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
