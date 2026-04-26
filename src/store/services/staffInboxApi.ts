import { api } from '../api';
import type { paths } from '../../types/api';

type TicketListResponse =
  paths['/staff-inbox']['get']['responses'][200]['content']['application/json'];
type TicketResponse =
  paths['/staff-inbox/{id}']['get']['responses'][200]['content']['application/json'];
type CreateTicketBody = NonNullable<
  paths['/staff-inbox']['post']['requestBody']
>['content']['application/json'];
type ReplyTicketBody = NonNullable<
  paths['/staff-inbox/{id}/reply']['post']['requestBody']
>['content']['application/json'];
type ReplyTicketResponse =
  paths['/staff-inbox/{id}/reply']['post']['responses'][201]['content']['application/json'];
type AssignBody = NonNullable<
  paths['/staff-inbox/{id}/assign']['post']['requestBody']
>['content']['application/json'];
type BulkResolveBody = NonNullable<
  paths['/staff-inbox/bulk-resolve']['post']['requestBody']
>['content']['application/json'];
type ResponsesResponse =
  paths['/staff-inbox/responses']['get']['responses'][200]['content']['application/json'];
type CreateResponseBody = NonNullable<
  paths['/staff-inbox/responses']['post']['requestBody']
>['content']['application/json'];
type UpdateResponseBody = NonNullable<
  paths['/staff-inbox/responses/{id}']['put']['requestBody']
>['content']['application/json'];
type UnreadCountResponse =
  paths['/staff-inbox/unread-count']['get']['responses'][200]['content']['application/json'];

export const staffInboxApi = api.injectEndpoints({
  endpoints: (build) => ({
    getStaffTickets: build.query<
      TicketListResponse,
      { page?: number; status?: string; assignedToMe?: boolean }
    >({
      query: ({ page = 1, status = 'all', assignedToMe = false } = {}) => ({
        url: '/staff-inbox',
        params: { page, status, assignedToMe }
      }),
      providesTags: ['StaffInbox']
    }),

    getMyTickets: build.query<TicketListResponse, { page?: number }>({
      query: ({ page = 1 } = {}) => ({
        url: '/staff-inbox/mine',
        params: { page }
      }),
      providesTags: ['StaffInbox']
    }),

    getStaffUnreadCount: build.query<UnreadCountResponse, void>({
      query: () => '/staff-inbox/unread-count',
      providesTags: ['StaffInbox']
    }),

    getTicket: build.query<TicketResponse, number>({
      query: (id) => `/staff-inbox/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'StaffInbox', id }]
    }),

    createTicket: build.mutation<TicketResponse, CreateTicketBody>({
      query: (body) => ({ url: '/staff-inbox', method: 'POST', body }),
      invalidatesTags: ['StaffInbox']
    }),

    replyToTicket: build.mutation<
      ReplyTicketResponse,
      { id: number } & ReplyTicketBody
    >({
      query: ({ id, ...body }) => ({
        url: `/staff-inbox/${id}/reply`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'StaffInbox', id },
        'StaffInbox'
      ]
    }),

    assignTicket: build.mutation<void, { id: number } & AssignBody>({
      query: ({ id, ...body }) => ({
        url: `/staff-inbox/${id}/assign`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'StaffInbox', id },
        'StaffInbox'
      ]
    }),

    resolveTicket: build.mutation<void, number>({
      query: (id) => ({ url: `/staff-inbox/${id}/resolve`, method: 'POST' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'StaffInbox', id },
        'StaffInbox'
      ]
    }),

    unresolveTicket: build.mutation<void, number>({
      query: (id) => ({ url: `/staff-inbox/${id}/unresolve`, method: 'POST' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'StaffInbox', id },
        'StaffInbox'
      ]
    }),

    bulkResolveTickets: build.mutation<
      { ok: boolean; resolved: number },
      BulkResolveBody
    >({
      query: (body) => ({
        url: '/staff-inbox/bulk-resolve',
        method: 'POST',
        body
      }),
      invalidatesTags: ['StaffInbox']
    }),

    getCannedResponses: build.query<ResponsesResponse, void>({
      query: () => '/staff-inbox/responses',
      providesTags: ['StaffInboxResponse']
    }),

    createCannedResponse: build.mutation<
      ResponsesResponse[number],
      CreateResponseBody
    >({
      query: (body) => ({
        url: '/staff-inbox/responses',
        method: 'POST',
        body
      }),
      invalidatesTags: ['StaffInboxResponse']
    }),

    updateCannedResponse: build.mutation<
      ResponsesResponse[number],
      { id: number } & UpdateResponseBody
    >({
      query: ({ id, ...body }) => ({
        url: `/staff-inbox/responses/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['StaffInboxResponse']
    }),

    deleteCannedResponse: build.mutation<void, number>({
      query: (id) => ({
        url: `/staff-inbox/responses/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['StaffInboxResponse']
    })
  })
});

export const {
  useGetStaffTicketsQuery,
  useGetMyTicketsQuery,
  useGetStaffUnreadCountQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useReplyToTicketMutation,
  useAssignTicketMutation,
  useResolveTicketMutation,
  useUnresolveTicketMutation,
  useBulkResolveTicketsMutation,
  useGetCannedResponsesQuery,
  useCreateCannedResponseMutation,
  useUpdateCannedResponseMutation,
  useDeleteCannedResponseMutation
} = staffInboxApi;
