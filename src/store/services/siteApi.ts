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
type StylesheetsResponse =
  paths['/stylesheet']['get']['responses'][200]['content']['application/json'];
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
    })
  })
});

export const {
  useGetSiteStatsQuery,
  useGetStylesheetsQuery,
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation
} = siteApi;
