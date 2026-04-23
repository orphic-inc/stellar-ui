import { api } from '../api';
import type { paths } from '../../types/api';

type ArtistsResponse =
  paths['/artists']['get']['responses'][200]['content']['application/json'];
type CreateArtistArgs = NonNullable<
  paths['/artists']['post']['requestBody']
>['content']['application/json'];
type CreateArtistResponse =
  paths['/artists']['post']['responses'][201]['content']['application/json'];
type ArtistResponse =
  paths['/artists/{id}']['get']['responses'][200]['content']['application/json'];
type UpdateArtistArgs = { id: number } & NonNullable<
  paths['/artists/{id}']['put']['requestBody']
>['content']['application/json'];
type UpdateArtistResponse =
  paths['/artists/{id}']['put']['responses'][200]['content']['application/json'];
type ArtistHistoryResponse =
  paths['/artists/history/{artistId}']['get']['responses'][200]['content']['application/json'];
type RevertArtistResponse =
  paths['/artists/revert/{historyId}']['post']['responses'][200]['content']['application/json'];
type SimilarArtistsResponse =
  paths['/artists/{id}/similar']['get']['responses'][200]['content']['application/json'];
type AddSimilarArtistArgs = NonNullable<
  paths['/artists/similar']['post']['requestBody']
>['content']['application/json'];
type AddArtistAliasArgs = NonNullable<
  paths['/artists/alias']['post']['requestBody']
>['content']['application/json'];
type TagArtistArgs = NonNullable<
  paths['/artists/tag']['post']['requestBody']
>['content']['application/json'];

export const artistApi = api.injectEndpoints({
  endpoints: (build) => ({
    getArtists: build.query<ArtistsResponse, void>({
      query: () => '/artists',
      providesTags: ['Artist']
    }),
    getArtistById: build.query<ArtistResponse, number>({
      query: (id) => `/artists/${id}`,
      providesTags: (_, __, id) => [{ type: 'Artist', id }]
    }),
    createArtist: build.mutation<CreateArtistResponse, CreateArtistArgs>({
      query: (data) => ({ url: '/artists', method: 'POST', body: data }),
      invalidatesTags: ['Artist']
    }),
    updateArtist: build.mutation<UpdateArtistResponse, UpdateArtistArgs>({
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
    getArtistHistory: build.query<ArtistHistoryResponse, number>({
      query: (artistId) => `/artists/history/${artistId}`
    }),
    revertArtist: build.mutation<RevertArtistResponse, number>({
      query: (historyId) => ({
        url: `/artists/revert/${historyId}`,
        method: 'POST'
      }),
      invalidatesTags: ['Artist']
    }),
    getSimilarArtists: build.query<SimilarArtistsResponse, number>({
      query: (id) => `/artists/${id}/similar`
    }),
    addSimilarArtist: build.mutation<
      Record<string, unknown>,
      AddSimilarArtistArgs
    >({
      query: (data) => ({
        url: '/artists/similar',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Artist']
    }),
    addArtistAlias: build.mutation<Record<string, unknown>, AddArtistAliasArgs>(
      {
        query: (data) => ({
          url: '/artists/alias',
          method: 'POST',
          body: data
        }),
        invalidatesTags: ['Artist']
      }
    ),
    tagArtist: build.mutation<Record<string, unknown>, TagArtistArgs>({
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
