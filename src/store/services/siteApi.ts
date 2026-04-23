import { api } from '../api';
import type { paths } from '../../types/api';

type SiteStatsResponse =
  paths['/stats']['get']['responses'][200]['content']['application/json'];
type StylesheetsResponse =
  paths['/stylesheet']['get']['responses'][200]['content']['application/json'];

export const siteApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSiteStats: build.query<SiteStatsResponse, void>({
      query: () => '/stats',
      providesTags: ['Stats']
    }),
    getStylesheets: build.query<StylesheetsResponse, void>({
      query: () => '/stylesheet',
      providesTags: ['Stylesheet']
    })
  })
});

export const { useGetSiteStatsQuery, useGetStylesheetsQuery } = siteApi;
