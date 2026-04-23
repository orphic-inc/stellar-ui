import { api } from '../api';
import type { SiteStats } from '../../types';

export const miscApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSiteStats: build.query<SiteStats, void>({
      query: () => '/stats',
      providesTags: ['Stats']
    }),
    getStylesheets: build.query<
      { id: number; name: string; cssUrl: string }[],
      void
    >({
      query: () => '/stylesheet',
      providesTags: ['Stylesheet']
    })
  })
});

export const { useGetSiteStatsQuery, useGetStylesheetsQuery } = miscApi;
