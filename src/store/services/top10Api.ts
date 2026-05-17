import { api } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Top10Tag {
  id: number;
  name: string;
}

export interface TopReleaseItem {
  rank: number;
  releaseId: number;
  title: string;
  year: number;
  artistId: number;
  artistName: string;
  type: string;
  releaseType: string;
  tags: Top10Tag[];
  consumerCount: number;
  totalBytesConsumed: string;
  contributionCount: number;
}

export interface TopUserItem {
  rank: number;
  userId: number;
  username: string;
  avatar: string | null;
  contributed: string;
  consumed: string;
  ratio: number;
  numContributions: number;
  contributionSpeed: number;
  consumeSpeed: number;
  joinedAt: string;
  rankName: string;
  rankLevel: number;
}

export interface TopTagItem {
  rank: number;
  tagId: number;
  name: string;
  uses: number;
  positiveVotes: number;
  negativeVotes: number;
}

export interface TopVoteItem {
  rank: number;
  releaseId: number;
  title: string;
  year: number;
  artistName: string;
  ups: number;
  downs: number;
  total: number;
  score: number;
  positivePercent: number;
}

export interface HistorySnapshotEntry {
  rank: number;
  releaseId: number | null;
  releaseTitle: string;
  tagString: string;
  deleted: boolean;
}

export interface HistorySnapshot {
  snapshotId: number;
  type: 'Daily' | 'Weekly';
  date: string;
  entries: HistorySnapshotEntry[];
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface ReleasesParams {
  type?:
    | 'day'
    | 'week'
    | 'month'
    | 'year'
    | 'overall'
    | 'consumed'
    | 'contributed';
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
    getTopReleases: build.query<{ items: TopReleaseItem[] }, ReleasesParams>({
      query: (p) => `/top10/releases${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    }),
    getTopUsers: build.query<{ items: TopUserItem[] }, UsersParams>({
      query: (p) => `/top10/users${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    }),
    getTopTags: build.query<{ items: TopTagItem[] }, TagsParams>({
      query: (p) => `/top10/tags${buildQs(p as Record<string, unknown>)}`,
      providesTags: ['Top10']
    }),
    getTopVotes: build.query<{ items: TopVoteItem[] }, VotesParams>({
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
