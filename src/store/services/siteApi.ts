import { api } from '../api';
import type { paths } from '../../types/api';

interface SiteStatsResponse {
  maxUsers: number;
  totalUsers: number;
  enabledUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  communities: number;
  releases: number;
  artists: number;
  contributedLinks: number;
  contributedLinkDownloads: number;
  announcements: number;
  blogPosts: number;
  comments: number;
}

export interface SiteStatSnapshot {
  id: number;
  capturedAt: string;
  maxUsers: number;
  totalUsers: number;
  enabledUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  communities: number;
  releases: number;
  artists: number;
  blogPosts: number;
  announcements: number;
  comments: number;
  contributedLinks: number;
  contributedLinkDownloads: number;
}

export interface UserStatSnapshot {
  id: number;
  userId: number;
  period: 'Daily' | 'Monthly' | 'Yearly';
  capturedAt: string;
  contributed: string | null;
  consumed: string | null;
  contributionCount: number;
}
type VersionResponse =
  paths['/version']['get']['responses'][200]['content']['application/json'];
type StylesheetsResponse =
  paths['/stylesheet']['get']['responses'][200]['content']['application/json'];
type StylesheetStatsResponse =
  paths['/stylesheet/admin/stats']['get']['responses'][200]['content']['application/json'];
type UpdateStylesheetBody = NonNullable<
  paths['/stylesheet/{id}']['put']['requestBody']
>['content']['application/json'];
type UpdateStylesheetResponse =
  paths['/stylesheet/{id}']['put']['responses'][200]['content']['application/json'];
interface SiteSettingsResponse {
  id: number;
  approvedDomains: string[];
  registrationStatus: 'open' | 'invite' | 'closed';
  maxUsers: number;
  dismissedLaunchChecklist: string[];
  updatedAt: string;
}
interface UpdateSettingsBody {
  approvedDomains?: string[];
  registrationStatus?: 'open' | 'invite' | 'closed';
  maxUsers?: number;
  dismissedLaunchChecklist?: string[];
}

export const siteApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSiteStats: build.query<SiteStatsResponse, void>({
      query: () => '/stats',
      providesTags: ['Stats']
    }),
    // Running platform version (#105) — the build-time __APP_VERSION__ tracks
    // only the UI bundle and never moves with API releases.
    getVersion: build.query<VersionResponse, void>({
      query: () => '/version',
      providesTags: ['SiteInfo']
    }),
    getStylesheets: build.query<StylesheetsResponse, void>({
      query: () => '/stylesheet',
      providesTags: ['Stylesheet']
    }),
    getSiteSettings: build.query<SiteSettingsResponse, void>({
      query: () => '/settings',
      providesTags: ['SiteSettings']
    }),
    updateSiteSettings: build.mutation<
      SiteSettingsResponse,
      UpdateSettingsBody
    >({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['SiteSettings']
    }),
    getSiteStatsHistory: build.query<SiteStatSnapshot[], void>({
      query: () => '/stats/history',
      providesTags: ['StatsHistory']
    }),
    triggerSiteSnapshot: build.mutation<void, void>({
      query: () => ({ url: '/stats/snapshot', method: 'POST' }),
      invalidatesTags: ['StatsHistory']
    }),
    getUserStatsHistory: build.query<
      UserStatSnapshot[],
      { userId: number; period: 'Daily' | 'Monthly' | 'Yearly' }
    >({
      query: ({ userId, period }) =>
        `/users/${userId}/stats/history?period=${period}`,
      providesTags: (_r, _e, { userId }) => [
        { type: 'UserStats' as const, id: userId }
      ]
    }),
    getStylesheetStats: build.query<StylesheetStatsResponse, void>({
      query: () => '/stylesheet/admin/stats',
      providesTags: ['Stylesheet']
    }),
    updateStylesheet: build.mutation<
      UpdateStylesheetResponse,
      { id: number } & UpdateStylesheetBody
    >({
      query: ({ id, ...body }) => ({
        url: `/stylesheet/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Stylesheet']
    })
  })
});

export const {
  useGetSiteStatsQuery,
  useGetVersionQuery,
  useGetStylesheetsQuery,
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
  useGetSiteStatsHistoryQuery,
  useTriggerSiteSnapshotMutation,
  useGetUserStatsHistoryQuery,
  useGetStylesheetStatsQuery,
  useUpdateStylesheetMutation
} = siteApi;
