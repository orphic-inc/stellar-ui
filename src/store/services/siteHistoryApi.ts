import { api } from '../api';
import type { paths } from '../../types/api';

export type SiteHistoryEntry =
  paths['/site-history']['get']['responses'][200]['content']['application/json'][number];
type SiteHistoryMutationResult =
  paths['/site-history']['post']['responses'][201]['content']['application/json'];

export const siteHistoryApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSiteHistory: build.query<SiteHistoryEntry[], void>({
      query: () => '/site-history',
      providesTags: ['SiteHistory']
    }),
    createSiteHistory: build.mutation<
      SiteHistoryMutationResult,
      { title: string; body: string }
    >({
      query: (body) => ({ url: '/site-history', method: 'POST', body }),
      invalidatesTags: ['SiteHistory']
    }),
    updateSiteHistory: build.mutation<
      SiteHistoryMutationResult,
      { id: number; title?: string; body?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/site-history/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SiteHistory']
    }),
    deleteSiteHistory: build.mutation<void, number>({
      query: (id) => ({ url: `/site-history/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SiteHistory']
    })
  })
});

export const {
  useGetSiteHistoryQuery,
  useCreateSiteHistoryMutation,
  useUpdateSiteHistoryMutation,
  useDeleteSiteHistoryMutation
} = siteHistoryApi;
