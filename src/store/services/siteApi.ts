import { api } from '../api';
import type { paths } from '../../types/api';

type SiteStatsResponse =
  paths['/stats']['get']['responses'][200]['content']['application/json'];
type StylesheetsResponse =
  paths['/stylesheet']['get']['responses'][200]['content']['application/json'];
type SiteSettingsResponse =
  paths['/settings']['get']['responses'][200]['content']['application/json'];
type UpdateSettingsBody = NonNullable<
  paths['/settings']['put']['requestBody']
>['content']['application/json'];

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
