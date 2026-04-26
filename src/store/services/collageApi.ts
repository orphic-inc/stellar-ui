import { api } from '../api';
import type {
  Collage,
  CollageEntry,
  CollageListResponse,
  ListCollagesQuery
} from '../../types';

export interface CreateCollagePayload {
  name: string;
  description: string;
  categoryId?: number;
  tags?: string[];
}

export interface UpdateCollagePayload {
  id: number;
  name?: string;
  description?: string;
  tags?: string[];
  isFeatured?: boolean;
  isLocked?: boolean;
  maxEntries?: number;
  maxEntriesPerUser?: number;
}

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

    getCollage: builder.query<Collage, number>({
      query: (id) => `/collages/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Collage', id }]
    }),

    createCollage: builder.mutation<Collage, CreateCollagePayload>({
      query: (body) => ({ url: '/collages', method: 'POST', body }),
      invalidatesTags: [{ type: 'Collage', id: 'LIST' }]
    }),

    updateCollage: builder.mutation<Collage, UpdateCollagePayload>({
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

    recoverCollage: builder.mutation<Collage, number>({
      query: (id) => ({ url: `/collages/${id}/recover`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Collage', id }]
    }),

    addCollageEntry: builder.mutation<
      CollageEntry,
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
