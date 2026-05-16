import { api } from '../api';

export interface SiteHistoryEntry {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: number; username: string } | null;
}

export const siteHistoryApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSiteHistory: build.query<SiteHistoryEntry[], void>({
      query: () => '/site-history',
      providesTags: ['SiteHistory']
    }),
    createSiteHistory: build.mutation<
      SiteHistoryEntry,
      { title: string; body: string }
    >({
      query: (body) => ({ url: '/site-history', method: 'POST', body }),
      invalidatesTags: ['SiteHistory']
    }),
    updateSiteHistory: build.mutation<
      SiteHistoryEntry,
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
