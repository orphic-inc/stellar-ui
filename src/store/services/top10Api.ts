import { api } from '../api';
import type { paths } from '../../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TopReleasesResponse =
  paths['/top10/releases']['get']['responses'][200]['content']['application/json'];
export type TopUsersResponse =
  paths['/top10/users']['get']['responses'][200]['content']['application/json'];
export type TopTagsResponse =
  paths['/top10/tags']['get']['responses'][200]['content']['application/json'];
export type TopVotesResponse =
  paths['/top10/votes']['get']['responses'][200]['content']['application/json'];

// Kept as NAMES because components type their props with them — but each is now
// a slice of the generated client, not a second description of the API (#293).
export type Top10Tag = TopReleasesResponse['items'][number]['tags'][number];
export type TopReleaseItem = TopReleasesResponse['items'][number];
export type TopUserItem = TopUsersResponse['items'][number];
export type TopTagItem = TopTagsResponse['items'][number];
export type TopVoteItem = TopVotesResponse['items'][number];

export type HistorySnapshot =
  paths['/top10/history']['get']['responses'][200]['content']['application/json'];
export type HistorySnapshotEntry = HistorySnapshot['entries'][number];

// ─── Query params ─────────────────────────────────────────────────────────────

export interface ReleasesParams {
  type?:
    'day' | 'week' | 'month' | 'year' | 'overall' | 'consumed' | 'contributed';
  limit?: 10 | 100 | 250;
  excludeTags?: string;
  format?: string;
}

export interface UsersParams {
  type?:
    | 'contributed'
    | 'consumed'
    | 'numContributions'
    | 'contributionSpeed'
    | 'consumeSpeed';
  limit?: 10 | 100 | 250;
}

export interface TagsParams {
  type?: 'used' | 'voted';
  limit?: 10 | 100 | 250;
}

export interface VotesParams {
  limit?: 25 | 100 | 250;
  tags?: string;
  year?: number;
}

export interface HistoryParams {
  type?: 'Daily' | 'Weekly';
  date?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

function buildQs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
  );
}

export const top10Api = api.injectEndpoints({
  endpoints: (build) => ({
    getTopReleases: build.query<TopReleasesResponse, ReleasesParams>({
      query: (p) => `/top10/releases${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    }),
    getTopUsers: build.query<TopUsersResponse, UsersParams>({
      query: (p) => `/top10/users${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    }),
    getTopTags: build.query<TopTagsResponse, TagsParams>({
      query: (p) => `/top10/tags${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    }),
    getTopVotes: build.query<TopVotesResponse, VotesParams>({
      query: (p) => `/top10/votes${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    }),
    getTop10History: build.query<HistorySnapshot, HistoryParams>({
      query: (p) => `/top10/history${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    })
  })
});

export const {
  useGetTopReleasesQuery,
  useGetTopUsersQuery,
  useGetTopTagsQuery,
  useGetTopVotesQuery,
  useGetTop10HistoryQuery
} = top10Api;
