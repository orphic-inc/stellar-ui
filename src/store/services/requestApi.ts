import { api } from '../api';
import type { components, paths } from '../../types/api';

// ui#277 — every result type below is derived from the vendored contract.
// Binding these turned up three corrections to stellar-api's registry
// (#486, #487, #488) and one real bug in this repo: `getRequestBountyHistory`
// was typed as a bare array, but the route answers `{ bounties, actions }`.
export type RequestItem = components['schemas']['Request'];
export type RequestDetailItem = components['schemas']['RequestDetail'];
export type RequestBounty = components['schemas']['RequestBountyEntry'];

// The API's ReleaseType, not a second hand-maintained copy of it.
export type ReleaseType = NonNullable<
  NonNullable<paths['/requests']['get']['parameters']['query']>['type']
>;

type ListRequestsResponse =
  paths['/requests']['get']['responses'][200]['content']['application/json'];
type RequestDetailResponse =
  paths['/requests/{id}']['get']['responses'][200]['content']['application/json'];
type CreateRequestResponse =
  paths['/requests']['post']['responses'][201]['content']['application/json'];
type UpdateRequestResponse =
  paths['/requests/{id}']['put']['responses'][200]['content']['application/json'];
type AddBountyResponse =
  paths['/requests/{id}/bounty']['post']['responses'][200]['content']['application/json'];
type FillRequestResponse =
  paths['/requests/{id}/fill']['post']['responses'][200]['content']['application/json'];
type UnfillRequestResponse =
  paths['/requests/{id}/unfill']['post']['responses'][200]['content']['application/json'];
// TWO parallel lists, not an array of bounties. See the note above.
export type BountyHistoryResponse =
  paths['/requests/{id}/bounty-history']['get']['responses'][200]['content']['application/json'];

export type CreateRequestPayload = NonNullable<
  paths['/requests']['post']['requestBody']
>['content']['application/json'];
type UpdateRequestBody = NonNullable<
  paths['/requests/{id}']['put']['requestBody']
>['content']['application/json'];
export type UpdateRequestPayload = UpdateRequestBody & { id: number };

export type ListRequestsQuery = NonNullable<
  paths['/requests']['get']['parameters']['query']
>;

export const requestApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listRequests: builder.query<ListRequestsResponse, ListRequestsQuery>({
      query: ({
        q,
        artist,
        type,
        year,
        page = 1,
        communityId,
        status,
        orderBy,
        order
      } = {}) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (q) params.set('q', q);
        if (artist) params.set('artist', artist);
        if (type) params.set('type', type);
        if (year != null) params.set('year', String(year));
        if (communityId != null) params.set('communityId', String(communityId));
        if (status != null) params.set('status', status);
        if (orderBy) params.set('orderBy', orderBy);
        if (order) params.set('order', order);
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

    getRequest: builder.query<RequestDetailResponse, number>({
      query: (id) => `/requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Request', id }]
    }),

    createRequest: builder.mutation<
      CreateRequestResponse,
      CreateRequestPayload
    >({
      query: (body) => ({
        url: '/requests',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Request', id: 'LIST' }]
    }),

    updateRequest: builder.mutation<
      UpdateRequestResponse,
      UpdateRequestPayload
    >({
      query: ({ id, ...body }) => ({
        url: `/requests/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Request', id },
        { type: 'Request', id: 'LIST' }
      ]
    }),

    addBounty: builder.mutation<
      AddBountyResponse,
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
      FillRequestResponse,
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
      UnfillRequestResponse,
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
    }),

    toggleRequestVote: builder.mutation<{ voted: boolean }, number>({
      query: (id) => ({ url: `/requests/${id}/vote`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Request', id }]
    }),

    getRequestBountyHistory: builder.query<BountyHistoryResponse, number>({
      query: (id) => `/requests/${id}/bounty-history`,
      providesTags: (_result, _error, id) => [{ type: 'Request', id }]
    })
  })
});

export const {
  useListRequestsQuery,
  useGetRequestQuery,
  useCreateRequestMutation,
  useUpdateRequestMutation,
  useAddBountyMutation,
  useFillRequestMutation,
  useUnfillRequestMutation,
  useDeleteRequestMutation,
  useToggleRequestVoteMutation,
  useGetRequestBountyHistoryQuery
} = requestApi;
