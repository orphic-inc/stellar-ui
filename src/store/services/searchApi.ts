import { api } from '../api';
import type { paths } from '../../types/api';

// ── Shared types ──────────────────────────────────────────────────────────────

export type PaginatedMeta =
  paths['/search/releases']['get']['responses'][200]['content']['application/json']['meta'];

// ── Release search ────────────────────────────────────────────────────────────

export type SearchReleasesParams = NonNullable<
  paths['/search/releases']['get']['parameters']['query']
>;
export type ReleaseSearchResult =
  paths['/search/releases']['get']['responses'][200]['content']['application/json']['data'][number];

// ── Artist search ─────────────────────────────────────────────────────────────

export type SearchArtistsParams = NonNullable<
  paths['/search/artists']['get']['parameters']['query']
>;
export type ArtistSearchResult =
  paths['/search/artists']['get']['responses'][200]['content']['application/json']['data'][number];

// ── Request search ────────────────────────────────────────────────────────────

export type SearchRequestsParams = NonNullable<
  paths['/search/requests']['get']['parameters']['query']
>;
export type RequestSearchResult =
  paths['/search/requests']['get']['responses'][200]['content']['application/json']['data'][number];

// ── Log search ────────────────────────────────────────────────────────────────

export type SearchLogParams = NonNullable<
  paths['/search/log']['get']['parameters']['query']
>;
export type LogSearchResponse =
  paths['/search/log']['get']['responses'][200]['content']['application/json'];
type LogSplitResponse = Extract<LogSearchResponse, { topics: unknown }>;
export type TopicSearchResult = LogSplitResponse['topics']['data'][number];
export type PostSearchResult = LogSplitResponse['posts']['data'][number];

// ── User search ───────────────────────────────────────────────────────────────

export type SearchUsersParams = NonNullable<
  paths['/search/users']['get']['parameters']['query']
>;
export type UserSearchResult =
  paths['/search/users']['get']['responses'][200]['content']['application/json']['data'][number];

// ── Random ────────────────────────────────────────────────────────────────────

export type RandomRelease =
  paths['/random/release']['get']['responses'][200]['content']['application/json'];
export type RandomArtist =
  paths['/random/artist']['get']['responses'][200]['content']['application/json'];

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
