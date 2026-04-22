import { api } from '../api';
import type { Artist } from '../../types';

export const artistApi = api.injectEndpoints({
  endpoints: (build) => ({
    getArtists: build.query<Artist[], void>({
      query: () => '/artists',
      providesTags: ['Artist']
    }),
    getArtistById: build.query<Artist, number>({
      query: (id) => `/artists/${id}`,
      providesTags: (_, __, id) => [{ type: 'Artist', id }]
    }),
    createArtist: build.mutation<Artist, Partial<Artist>>({
      query: (data) => ({ url: '/artists', method: 'POST', body: data }),
      invalidatesTags: ['Artist']
    }),
    updateArtist: build.mutation<Artist, { id: number } & Partial<Artist>>({
      query: ({ id, ...data }) => ({
        url: `/artists/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Artist', id }]
    }),
    deleteArtist: build.mutation<void, number>({
      query: (id) => ({ url: `/artists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Artist']
    }),
    getArtistHistory: build.query<unknown[], number>({
      query: (artistId) => `/artists/history/${artistId}`
    }),
    revertArtist: build.mutation<void, number>({
      query: (historyId) => ({
        url: `/artists/revert/${historyId}`,
        method: 'POST'
      }),
      invalidatesTags: ['Artist']
    }),
    getSimilarArtists: build.query<Artist[], number>({
      query: (id) => `/artists/${id}/similar`
    }),
    addSimilarArtist: build.mutation<
      void,
      { artistId: number; similarId: number }
    >({
      query: (data) => ({
        url: '/artists/similar',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Artist']
    }),
    addArtistAlias: build.mutation<void, { artistId: number; alias: string }>({
      query: (data) => ({ url: '/artists/alias', method: 'POST', body: data }),
      invalidatesTags: ['Artist']
    }),
    tagArtist: build.mutation<void, { artistId: number; tag: string }>({
      query: (data) => ({ url: '/artists/tag', method: 'POST', body: data }),
      invalidatesTags: (_, __, { artistId }) => [
        { type: 'Artist', id: artistId }
      ]
    })
  })
});

export const {
  useGetArtistsQuery,
  useGetArtistByIdQuery,
  useCreateArtistMutation,
  useUpdateArtistMutation,
  useDeleteArtistMutation,
  useGetArtistHistoryQuery,
  useRevertArtistMutation,
  useGetSimilarArtistsQuery,
  useAddSimilarArtistMutation,
  useAddArtistAliasMutation,
  useTagArtistMutation
} = artistApi;
