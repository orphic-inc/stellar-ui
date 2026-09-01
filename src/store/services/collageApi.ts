import { api } from '../api';
import type { components, paths } from '../../types/api';

// ui#277 — result types come from the vendored contract. The collage routes
// project TWO collage shapes and the registry already named them:
//
//   Collage        list rows, and the create / update / recover echoes
//   CollageDetail  GET /collages/{id} only — adds entries, isSubscribed,
//                  isBookmarked
//
// The hand-written type this replaces was one flat interface with all three of
// those optional, so a list row and a detail read were indistinguishable.
export type Collage = components['schemas']['Collage'];
export type CollageDetail = components['schemas']['CollageDetail'];
export type CollageEntry = components['schemas']['CollageEntry'];

type CollageListResponse =
  paths['/collages']['get']['responses'][200]['content']['application/json'];
type CollageDetailResponse =
  paths['/collages/{id}']['get']['responses'][200]['content']['application/json'];
type CreateCollageResponse =
  paths['/collages']['post']['responses'][201]['content']['application/json'];
type UpdateCollageResponse =
  paths['/collages/{id}']['put']['responses'][200]['content']['application/json'];
type RecoverCollageResponse =
  paths['/collages/{id}/recover']['post']['responses'][200]['content']['application/json'];
type AddCollageEntryResponse =
  paths['/collages/{id}/entries']['post']['responses'][201]['content']['application/json'];

export type CreateCollagePayload = NonNullable<
  paths['/collages']['post']['requestBody']
>['content']['application/json'];
type UpdateCollageBody = NonNullable<
  paths['/collages/{id}']['put']['requestBody']
>['content']['application/json'];
export type UpdateCollagePayload = UpdateCollageBody & { id: number };

export type ListCollagesQuery = NonNullable<
  paths['/collages']['get']['parameters']['query']
>;

export interface ReorderEntriesPayload {
  id: number;
  entries: Array<{ id: number; sort: number }>;
}

export const collageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCollages: builder.query<CollageListResponse, ListCollagesQuery>({
      query: ({
        page = 1,
        search,
        categoryId,
        userId,
        bookmarked,
        orderBy,
        order
      } = {}) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (search) params.set('search', search);
        if (categoryId != null) params.set('categoryId', String(categoryId));
        if (userId != null) params.set('userId', String(userId));
        if (bookmarked) params.set('bookmarked', bookmarked);
        if (orderBy) params.set('orderBy', orderBy);
        if (order) params.set('order', order);
        return `/collages?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Collage' as const,
                id
              })),
              { type: 'Collage', id: 'LIST' }
            ]
          : [{ type: 'Collage', id: 'LIST' }]
    }),

    getCollage: builder.query<CollageDetailResponse, number>({
      query: (id) => `/collages/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Collage', id }]
    }),

    createCollage: builder.mutation<
      CreateCollageResponse,
      CreateCollagePayload
    >({
      query: (body) => ({ url: '/collages', method: 'POST', body }),
      invalidatesTags: [{ type: 'Collage', id: 'LIST' }]
    }),

    updateCollage: builder.mutation<
      UpdateCollageResponse,
      UpdateCollagePayload
    >({
      query: ({ id, ...body }) => ({
        url: `/collages/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Collage', id },
        { type: 'Collage', id: 'LIST' }
      ]
    }),

    deleteCollage: builder.mutation<void, number>({
      query: (id) => ({ url: `/collages/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Collage', id },
        { type: 'Collage', id: 'LIST' }
      ]
    }),

    recoverCollage: builder.mutation<RecoverCollageResponse, number>({
      query: (id) => ({ url: `/collages/${id}/recover`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Collage', id }]
    }),

    addCollageEntry: builder.mutation<
      AddCollageEntryResponse,
      { id: number; releaseId: number }
    >({
      query: ({ id, releaseId }) => ({
        url: `/collages/${id}/entries`,
        method: 'POST',
        body: { releaseId }
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Collage', id }]
    }),

    removeCollageEntry: builder.mutation<
      void,
      { id: number; releaseId: number }
    >({
      query: ({ id, releaseId }) => ({
        url: `/collages/${id}/entries/${releaseId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Collage', id }]
    }),

    reorderCollageEntries: builder.mutation<void, ReorderEntriesPayload>({
      query: ({ id, entries }) => ({
        url: `/collages/${id}/entries`,
        method: 'PUT',
        body: { entries }
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Collage', id }]
    }),

    subscribeCollage: builder.mutation<{ subscribed: boolean }, number>({
      query: (id) => ({ url: `/collages/${id}/subscribe`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Collage', id }]
    }),

    bookmarkCollage: builder.mutation<{ bookmarked: boolean }, number>({
      query: (id) => ({ url: `/collages/${id}/bookmark`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Collage', id },
        { type: 'Collage', id: 'LIST' }
      ]
    })
  })
});

export const {
  useListCollagesQuery,
  useGetCollageQuery,
  useCreateCollageMutation,
  useUpdateCollageMutation,
  useDeleteCollageMutation,
  useRecoverCollageMutation,
  useAddCollageEntryMutation,
  useRemoveCollageEntryMutation,
  useReorderCollageEntriesMutation,
  useSubscribeCollageMutation,
  useBookmarkCollageMutation
} = collageApi;
