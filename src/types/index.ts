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

// ─── Site stats ─────────────────────────────────────────────────────────────

export type SiteStats = components['schemas']['SiteStats'];

// ─── Redux state types ───────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
