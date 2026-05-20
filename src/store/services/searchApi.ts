import { api } from '../api';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ArtistRef {
  id: number;
  name: string;
}
interface UserRef {
  id: number;
  username: string;
}
interface TagRef {
  id: number;
  name: string;
}

// ── Release search ────────────────────────────────────────────────────────────

export interface SearchReleasesParams {
  q?: string;
  tags?: string;
  tagMode?: 'any' | 'all';
  orderBy?: 'createdAt' | 'year' | 'consumers' | 'contributors' | 'random';
  order?: 'asc' | 'desc';
  communityId?: number | number[];
  artist?: string;
  title?: string;
  recordLabel?: string;
  catalogueNumber?: string;
  year?: number;
  yearTo?: number;
  description?: string;
  type?: string;
  releaseType?: string;
  format?: string;
  bitrate?: string;
  media?: string;
  hasLog?: boolean;
  hasCue?: boolean;
  isScene?: boolean;
  vanityHouse?: boolean;
  page?: number;
  limit?: number;
}

export interface ReleaseSearchResult {
  id: number;
  title: string;
  year: number;
  type: string;
  releaseType: string;
  communityId: number | null;
  catalogueNumber: string | null;
  recordLabel: string | null;
  description: string;
  createdAt: string;
  artist: ArtistRef & { vanityHouse: boolean };
  tags: TagRef[];
  _count: { consumers: number; contributors: number };
}

// ── Artist search ─────────────────────────────────────────────────────────────

export interface SearchArtistsParams {
  q?: string;
  tags?: string;
  tagMode?: 'any' | 'all';
  vanityHouse?: boolean;
  orderBy?: 'name' | 'random';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ArtistSearchResult {
  id: number;
  name: string;
  vanityHouse: boolean;
  tags: Array<{ tag: TagRef }>;
  _count: { releases: number };
}

// ── Request search ────────────────────────────────────────────────────────────

export interface SearchRequestsParams {
  q?: string;
  artist?: string;
  type?: string;
  year?: number;
  status?: string;
  communityId?: number;
  orderBy?: 'createdAt' | 'voteCount' | 'random';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RequestSearchResult {
  id: number;
  title: string;
  description: string;
  type: string;
  year: number | null;
  status: string;
  voteCount: number;
  communityId: number;
  createdAt: string;
  user: UserRef;
  community?: { id: number; name: string };
  artists: Array<{ artist: ArtistRef }>;
  totalBounty: string;
  _count: { bounties: number };
}

// ── Log search ────────────────────────────────────────────────────────────────

export interface SearchLogParams {
  q?: string;
  type?: 'topic' | 'post' | 'all';
  authorId?: number;
  orderBy?: 'createdAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TopicSearchResult {
  id: number;
  title: string;
  createdAt: string;
  isLocked: boolean;
  isSticky: boolean;
  numPosts: number;
  forumId: number;
  author: UserRef;
}

export interface PostSearchResult {
  id: number;
  body: string;
  createdAt: string;
  forumTopicId: number;
  author: UserRef;
}

export type LogSearchResponse =
  | { data: TopicSearchResult[]; meta: PaginatedMeta }
  | { data: PostSearchResult[]; meta: PaginatedMeta }
  | {
      topics: { data: TopicSearchResult[]; meta: PaginatedMeta };
      posts: { data: PostSearchResult[]; meta: PaginatedMeta };
    };

// ── User search ───────────────────────────────────────────────────────────────

export interface SearchUsersParams {
  q?: string;
  orderBy?: 'username' | 'createdAt' | 'lastLogin';
  order?: 'asc' | 'desc';
  disabled?: boolean;
  page?: number;
  limit?: number;
}

export interface UserSearchResult {
  id: number;
  username: string;
  createdAt: string;
  userRank: { name: string; color: string | null };
  // staff-only fields (may be absent for regular users)
  email?: string;
  lastLogin?: string | null;
  disabled?: boolean;
  ratio?: number | null;
  contributed?: string;
  consumed?: string;
}

// ── Random ────────────────────────────────────────────────────────────────────

export interface RandomRelease {
  id: number;
  communityId: number | null;
  title: string;
  year: number;
  artist: ArtistRef;
}

export interface RandomArtist {
  id: number;
  name: string;
}

// ── API endpoints ─────────────────────────────────────────────────────────────

export const searchApi = api.injectEndpoints({
  endpoints: (build) => ({
    searchReleases: build.query<
      { data: ReleaseSearchResult[]; meta: PaginatedMeta },
      SearchReleasesParams
    >({
      query: (params) => ({ url: '/search/releases', params }),
      providesTags: [{ type: 'Release', id: 'SEARCH' }]
    }),

    searchArtists: build.query<
      { data: ArtistSearchResult[]; meta: PaginatedMeta },
      SearchArtistsParams
    >({
      query: (params) => ({ url: '/search/artists', params }),
      providesTags: [{ type: 'Artist', id: 'SEARCH' }]
    }),

    searchRequests: build.query<
      { data: RequestSearchResult[]; meta: PaginatedMeta },
      SearchRequestsParams
    >({
      query: (params) => ({ url: '/search/requests', params }),
      providesTags: [{ type: 'Request', id: 'SEARCH' }]
    }),

    searchLog: build.query<LogSearchResponse, SearchLogParams>({
      query: (params) => ({ url: '/search/log', params })
    }),

    searchUsers: build.query<
      { data: UserSearchResult[]; meta: PaginatedMeta },
      SearchUsersParams
    >({
      query: (params) => ({ url: '/search/users', params }),
      providesTags: [{ type: 'User', id: 'SEARCH' }]
    }),

    getRandomRelease: build.query<RandomRelease, void>({
      query: () => '/random/release'
    }),

    getRandomArtist: build.query<RandomArtist, void>({
      query: () => '/random/artist'
    })
  })
});

export const {
  useSearchReleasesQuery,
  useSearchArtistsQuery,
  useSearchRequestsQuery,
  useSearchLogQuery,
  useSearchUsersQuery,
  useLazyGetRandomReleaseQuery,
  useLazyGetRandomArtistQuery
} = searchApi;
