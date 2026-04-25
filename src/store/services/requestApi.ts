import { api } from '../api';
import type {
  RequestItem,
  RequestsListResponse,
  RequestStatus
} from '../../types';

export type ReleaseType =
  | 'Music'
  | 'Applications'
  | 'EBooks'
  | 'ELearningVideos'
  | 'Audiobooks'
  | 'Comedy'
  | 'Comics';

export interface CreateRequestPayload {
  communityId: number;
  type: ReleaseType;
  title: string;
  description: string;
  bounty: string;
  year?: number;
  image?: string;
  artists?: number[];
}

export interface ListRequestsQuery {
  page?: number;
  communityId?: number;
  status?: RequestStatus;
}

export const requestApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listRequests: builder.query<RequestsListResponse, ListRequestsQuery>({
      query: ({ page = 1, communityId, status } = {}) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (communityId != null) params.set('communityId', String(communityId));
        if (status != null) params.set('status', status);
        return `/requests?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Request' as const,
                id
              })),
              { type: 'Request', id: 'LIST' }
            ]
          : [{ type: 'Request', id: 'LIST' }]
    }),

    getRequest: builder.query<RequestItem, number>({
      query: (id) => `/requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Request', id }]
    }),

    createRequest: builder.mutation<RequestItem, CreateRequestPayload>({
      query: (body) => ({
        url: '/requests',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Request', id: 'LIST' }]
    }),

    addBounty: builder.mutation<
      RequestItem,
      { requestId: number; amount: string }
    >({
      query: ({ requestId, amount }) => ({
        url: `/requests/${requestId}/bounty`,
        method: 'POST',
        body: { amount }
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        { type: 'Request', id: requestId },
        { type: 'Request', id: 'LIST' }
      ]
    }),

    fillRequest: builder.mutation<
      RequestItem,
      { requestId: number; contributionId: number }
    >({
      query: ({ requestId, contributionId }) => ({
        url: `/requests/${requestId}/fill`,
        method: 'POST',
        body: { contributionId }
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        { type: 'Request', id: requestId },
        { type: 'Request', id: 'LIST' }
      ]
    }),

    unfillRequest: builder.mutation<
      RequestItem,
      { requestId: number; reason?: string }
    >({
      query: ({ requestId, reason }) => ({
        url: `/requests/${requestId}/unfill`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        { type: 'Request', id: requestId },
        { type: 'Request', id: 'LIST' }
      ]
    }),

    deleteRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/requests/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Request', id },
        { type: 'Request', id: 'LIST' }
      ]
    })
  })
});

export const {
  useListRequestsQuery,
  useGetRequestQuery,
  useCreateRequestMutation,
  useAddBountyMutation,
  useFillRequestMutation,
  useUnfillRequestMutation,
  useDeleteRequestMutation
} = requestApi;
