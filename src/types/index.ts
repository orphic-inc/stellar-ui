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
export type Release = components['schemas']['Release'];

// ─── Profile ─────────────────────────────────────────────────────────────────

export type InviteNode = components['schemas']['InviteNode'];

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

export type RequestStatus = 'open' | 'filled';

export interface RequestBounty {
  id: number;
  requestId: number;
  userId: number;
  amount: string; // BigInt serialized to string on the wire
  createdAt: string;
  user?: { id: number; username: string };
}

export interface RequestItem {
  id: number;
  communityId: number;
  userId: number;
  title: string;
  description: string;
  type: string;
  year: number | null;
  image: string | null;
  status: RequestStatus;
  fillerId: number | null;
  filledAt: string | null;
  filledContributionId: number | null;
  totalBounty: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user?: { id: number; username: string };
  filler?: { id: number; username: string } | null;
  community?: { id: number; name: string };
  bounties?: RequestBounty[];
  artists?: Array<{ artistId: number; artist: { id: number; name: string } }>;
}

export interface RequestsListResponse {
  data: RequestItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Ratio ───────────────────────────────────────────────────────────────────

export type RatioPolicyStatus = 'OK' | 'WATCH' | 'LEECH_DISABLED';

export interface PolicyStateView {
  status: RatioPolicyStatus;
  watchStartedAt: string | null;
  watchExpiresAt: string | null;
  leechDisabledAt: string | null;
  lastEvaluatedAt: string;
}

export interface RatioBracket {
  label: string;
  maxRequired: number;
  minRequired: number;
}

export interface RatioStats {
  ratio: number;
  totalEarned: string;
  downloaded: string;
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

export interface CollageEntryRelease {
  id: number;
  title: string;
  image: string | null;
  year: number;
  releaseType: string;
  artist: { id: number; name: string };
}

export interface CollageEntry {
  id: number;
  collageId: number;
  releaseId: number;
  userId: number;
  sort: number;
  addedAt: string;
  release?: CollageEntryRelease;
  user?: { id: number; username: string };
}

export interface CollageCounts {
  entries: number;
  subscriptions: number;
  bookmarks: number;
}

export interface Collage {
  id: number;
  name: string;
  description: string;
  userId: number;
  categoryId: number;
  tags: string[];
  isLocked: boolean;
  isDeleted: boolean;
  maxEntries: number;
  maxEntriesPerUser: number;
  isFeatured: boolean;
  numEntries: number;
  numSubscribers: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user?: { id: number; username: string; avatar: string | null };
  _count?: CollageCounts;
  entries?: CollageEntry[];
  isSubscribed?: boolean;
  isBookmarked?: boolean;
}

export interface CollageListResponse {
  data: Collage[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type CollageOrderBy =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'numEntries'
  | 'numSubscribers';

export interface ListCollagesQuery {
  page?: number;
  search?: string;
  categoryId?: number;
  userId?: number;
  bookmarked?: 'true' | 'false';
  orderBy?: CollageOrderBy;
  order?: 'asc' | 'desc';
}

// ─── Redux state types ───────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
