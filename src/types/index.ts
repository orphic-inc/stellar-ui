// ─── Auth / User ────────────────────────────────────────────────────────────

export interface UserRank {
  id: number;
  level: number;
  name: string;
  permissions?: Record<string, boolean>;
  color?: string;
  badge?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  inviteCount?: number;
  userRankId?: number;
  userRank?: UserRank;
  createdAt: string;
}

// ─── Alert ──────────────────────────────────────────────────────────────────

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

export interface Alert {
  id: string;
  msg: string;
  alertType: AlertType;
}

// ─── Forum ───────────────────────────────────────────────────────────────────

export interface ForumCategory {
  id: number;
  name: string;
  sort: number;
  forums?: Forum[];
}

export interface Forum {
  id: number;
  name: string;
  description?: string;
  sort: number;
  minClassRead?: number;
  minClassWrite?: number;
  minClassCreate?: number;
  numTopics: number;
  numPosts: number;
  forumCategory?: Pick<ForumCategory, 'id' | 'name'>;
  topics?: ForumTopic[];
  lastTopic?: Pick<ForumTopic, 'id' | 'title'>;
}

export interface ForumTopic {
  id: number;
  title: string;
  isLocked: boolean;
  isSticky: boolean;
  numPosts: number;
  author?: Pick<AuthUser, 'id' | 'username'>;
  lastPost?: Pick<ForumPost, 'id' | 'createdAt'>;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: number;
  body: string;
  author?: Pick<AuthUser, 'id' | 'username' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPollVote {
  id: number;
  userId: number;
  vote: number;
}

export interface ForumPoll {
  id: number;
  question: string;
  answers: string; // JSON-encoded string[]
  closed: boolean;
  votes: ForumPollVote[];
}

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

export interface Community {
  id: number;
  name: string;
  description?: string;
  type?: CommunityType;
  registrationStatus?: RegistrationStatus;
  _count?: { releases: number; contributors: number; consumers: number };
}

export interface ReleaseContribution {
  id: number;
  user: { id: number; username: string };
  releaseDescription?: string;
  collaborators: Artist[];
}

export interface Contribution {
  id: number;
  user: { id: number; username: string };
  release: { id: number; title: string; communityId?: number };
  collaborators: { id: number; name: string }[];
  releaseDescription?: string;
  createdAt?: string;
}

export interface Release {
  id: number;
  title: string;
  year?: number;
  type?: string;
  communityId: number;
  image?: string;
  description?: string;
  artist?: Artist;
  tags?: { id: number; name: string }[];
  contributions?: ReleaseContribution[];
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface InviteNode {
  id: number;
  username: string;
  email: string;
  joinedAt?: string;
  lastSeen?: string;
  uploaded?: string;
  downloaded?: string;
  ratio?: string;
  children?: InviteNode[];
}

export interface Profile {
  userId: number;
  username: string;
  avatar?: string;
  info?: string;
  joinedAt?: string;
  lastSeen?: string;
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

// ─── Permissions (UserRank admin) ────────────────────────────────────────────

export interface Permission {
  id: number;
  name: string;
  level: number;
  permissions?: Record<string, boolean>;
  userCount?: number;
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

export interface AnnouncementsResponse {
  data: {
    announcements: Announcement[];
    blogPosts: BlogPost[];
  };
}

export interface Artist {
  id: number;
  name: string;
  image?: string;
  body?: string;
}

export interface Collaborator {
  artist: string;
  importance: string;
}

// ─── Site stats ─────────────────────────────────────────────────────────────

export interface SiteStats {
  maxUsers?: number;
  enabledUsers?: number;
  activeToday?: number;
  activeThisWeek?: number;
  activeThisMonth?: number;
  communities?: number;
  releases?: number;
  artists?: number;
  requests?: number;
  seeders?: number;
  leechers?: number;
  peers?: number;
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
