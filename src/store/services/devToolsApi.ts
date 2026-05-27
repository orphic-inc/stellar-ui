/**
 * store/services/devToolsApi.ts
 *
 * RTK Query endpoints for the developer-only test data generation tool.
 * These endpoints are only functional in non-production environments.
 */

import { api } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GenerationMode = 'isolated' | 'integrated';

export type SectionKey =
  | 'users'
  | 'communities'
  | 'releases'
  | 'contributions'
  | 'collages'
  | 'requests'
  | 'forum'
  | 'wiki'
  | 'reports'
  | 'staffInbox'
  | 'messages'
  | 'announcements'
  | 'stats'
  | 'moderation'
  | 'donations'
  | 'invites';

export type PresetKey = 'minimal' | 'balanced' | 'large' | 'edge_case';

export interface GenerateConfig {
  seed?: number;
  scale?: number;
  preset?: PresetKey;
  sections?: SectionKey[];
  mode?: GenerationMode;
  includeEdgeCases?: boolean;
  includeModerationData?: boolean;
  includeStatsData?: boolean;
  dryRun?: boolean;
  label?: string;
}

export interface DevStatus {
  enabled: boolean;
  environment: string;
  runCount: number;
  jobsEnabled: boolean;
  warning: string | null;
}

export interface SeedRunSummary {
  id: string;
  label: string | null;
  mode: string;
  config: Record<string, unknown>;
  summary: Record<string, number>;
  warnings: string[] | null;
  cleanupStatus: string;
  reversibilityLevel: string;
  actorId: number;
  createdAt: string;
  updatedAt: string;
  _count: { records: number; mutations: number };
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message?: string;
}

export interface GenerateResult {
  runId: string;
  summary: Record<string, number>;
  validation: { passed: boolean; checks: ValidationCheck[] };
  warnings: string[];
  dryRun: boolean;
}

export interface EstimateResult {
  counts: Record<string, number>;
  warnings: string[];
  sections: SectionKey[];
  mode: GenerationMode;
}

export interface CleanupResult {
  runId: string;
  status: 'cleaned' | 'partial' | 'failed';
  deletedCounts: Record<string, number>;
  revertedMutationCounts: number;
  warnings: string[];
  failedItems: Array<{ entityType: string; pk: unknown; error: string }>;
}

export interface BulkCleanupResult {
  cleaned: number;
  partial: number;
  failed: number;
  results: CleanupResult[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const devToolsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDevStatus: build.query<DevStatus, void>({
      query: () => '/dev/status',
      providesTags: ['DevSeedRun']
    }),

    listSeedRuns: build.query<SeedRunSummary[], void>({
      query: () => '/dev/runs',
      providesTags: ['DevSeedRun']
    }),

    getSeedRun: build.query<SeedRunSummary, string>({
      query: (id) => `/dev/runs/${id}`,
      providesTags: (result) =>
        result ? [{ type: 'DevSeedRun', id: result.id }] : ['DevSeedRun']
    }),

    estimateGenerate: build.mutation<EstimateResult, GenerateConfig>({
      query: (body) => ({
        url: '/dev/estimate',
        method: 'POST',
        body
      })
      // No tag invalidation — estimate is read-only
    }),

    generateData: build.mutation<GenerateResult, GenerateConfig>({
      query: (body) => ({
        url: '/dev/generate',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DevSeedRun']
    }),

    cleanupRun: build.mutation<CleanupResult, string>({
      query: (id) => ({
        url: `/dev/runs/${id}/cleanup`,
        method: 'POST'
      }),
      invalidatesTags: ['DevSeedRun']
    }),

    cleanupAllRuns: build.mutation<BulkCleanupResult, void>({
      query: () => ({
        url: '/dev/cleanup-all',
        method: 'POST'
      }),
      invalidatesTags: ['DevSeedRun']
    })
  }),
  overrideExisting: false
});

export const {
  useGetDevStatusQuery,
  useListSeedRunsQuery,
  useGetSeedRunQuery,
  useEstimateGenerateMutation,
  useGenerateDataMutation,
  useCleanupRunMutation,
  useCleanupAllRunsMutation
} = devToolsApi;
