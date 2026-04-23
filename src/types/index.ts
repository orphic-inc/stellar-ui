import type { components } from './api';

// ─── Auth / User ────────────────────────────────────────────────────────────

export interface UserRank {
  id: number;
  level: number;
  name: string;
  permissions?: Record<string, boolean>;
  color?: string;
  badge?: string;
  userCount?: number;
}

export interface AuthUserRank {
  level: number;
  name: string;
  permissions?: Record<string, boolean>;
  color?: string;
  badge?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  avatar?: string | null;
  inviteCount?: number;
  userRankId?: number;
  userRank?: AuthUserRank;
  dateRegistered?: string;
  lastLogin?: string | null;
  isArtist?: boolean;
  isDonor?: boolean;
  canDownload?: boolean;
}

export interface PublicUser {
  id: number;
  username: string;
  avatar?: string;
  dateRegistered?: string;
  isArtist?: boolean;
  isDonor?: boolean;
  userRank?: Pick<AuthUserRank, 'name' | 'color' | 'badge'>;
  profile?: ProfileDetails;
  userSettings?: { siteAppearance?: string; styledTooltips?: boolean };
}

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

export interface InviteNode {
  id: number;
  username: string;
  email: string;
  joinedAt?: string;
  lastSeen?: string | null;
  uploaded?: string;
  downloaded?: string;
  ratio?: string;
  children?: InviteNode[];
}

export interface ProfileDetails {
  id: number;
  avatar?: string;
  avatarMouseoverText?: string;
  profileTitle?: string;
  profileInfo?: string;
}

export interface Profile {
  id: number;
  username: string;
  avatar?: string;
  dateRegistered?: string;
  isArtist?: boolean;
  isDonor?: boolean;
  userRank?: { name: string; color: string; badge?: string };
  profile?: ProfileDetails;
  userSettings?: { siteAppearance?: string; styledTooltips?: boolean };
  inviteTree?: InviteNode[];
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface UserSettings {
  id?: number;
  siteAppearance?: string;
  externalStylesheet?: string;
  styledTooltips?: boolean;
  paranoia?: number;
  avatar?: string;
}

// ─── Misc ────────────────────────────────────────────────────────────────────

export interface Announcement {
  id: number;
  title: string;
  body?: string;
  createdAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  body?: string;
  createdAt: string;
  user?: Pick<AuthUser, 'id' | 'username'>;
}

export type AnnouncementsResponse =
  components['schemas']['AnnouncementsResponse'];
export type Artist = components['schemas']['Artist'];

export interface Collaborator {
  artist: string;
  importance: string;
}

// ─── Site stats ─────────────────────────────────────────────────────────────

export type SiteStats = components['schemas']['SiteStats'];

export interface HomepageFeaturedRelease {
  id: number;
  title: string;
  year?: number;
  image?: string | null;
  communityId?: number | null;
  artist?: { id: number; name: string };
}

export interface HomepageFeaturedAlbum {
  id: number;
  title: string;
  started: string;
  ended: string;
  threadId?: number | null;
  release: HomepageFeaturedRelease;
}

export interface HomepageFeaturedContent {
  albumOfTheMonth: HomepageFeaturedAlbum | null;
  vanityHouse: HomepageFeaturedRelease | null;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Redux state types ───────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
