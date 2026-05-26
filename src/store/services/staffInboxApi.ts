import { api } from '../api';
import type { paths } from '../../types/api';

// ─── Canned Responses ─────────────────────────────────────────────────────────

type ResponsesResponse =
  paths['/staff-inbox/responses']['get']['responses'][200]['content']['application/json'];
type CreateResponseBody = NonNullable<
  paths['/staff-inbox/responses']['post']['requestBody']
>['content']['application/json'];
type UpdateResponseBody = NonNullable<
  paths['/staff-inbox/responses/{id}']['put']['requestBody']
>['content']['application/json'];

// ─── Tickets ──────────────────────────────────────────────────────────────────

type TicketResponse =
  paths['/staff-inbox/tickets/{id}']['get']['responses'][200]['content']['application/json'];
type PaginatedTickets =
  paths['/staff-inbox/tickets']['get']['responses'][200]['content']['application/json'];
type QueueResponse =
  paths['/staff-inbox/queue']['get']['responses'][200]['content']['application/json'];
type QueueCountResponse =
  paths['/staff-inbox/queue/count']['get']['responses'][200]['content']['application/json'];
type CreateTicketBody = NonNullable<
  paths['/staff-inbox/tickets']['post']['requestBody']
>['content']['application/json'];
type ReplyBody = NonNullable<
  paths['/staff-inbox/tickets/{id}/reply']['post']['requestBody']
>['content']['application/json'];
type AssignBody = NonNullable<
  paths['/staff-inbox/tickets/{id}/assign']['post']['requestBody']
>['content']['application/json'];
type BulkResolveBody = NonNullable<
  paths['/staff-inbox/bulk-resolve']['post']['requestBody']
>['content']['application/json'];
type BulkResolveResponse =
  paths['/staff-inbox/bulk-resolve']['post']['responses'][200]['content']['application/json'];

export const staffInboxApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ─── Canned Responses ───────────────────────────────────────────────────
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
    }),

    // ─── Tickets ────────────────────────────────────────────────────────────
    getMyTicketCount: build.query<
      paths['/staff-inbox/tickets/count']['get']['responses'][200]['content']['application/json'],
      void
    >({
      query: () => '/staff-inbox/tickets/count',
      providesTags: ['StaffInboxTicket']
    }),

    getMyTickets: build.query<PaginatedTickets, { page?: number }>({
      query: ({ page = 1 } = {}) => ({
        url: '/staff-inbox/tickets',
        params: { page }
      }),
      providesTags: ['StaffInboxTicket']
    }),

    createTicket: build.mutation<TicketResponse, CreateTicketBody>({
      query: (body) => ({ url: '/staff-inbox/tickets', method: 'POST', body }),
      invalidatesTags: ['StaffInboxTicket']
    }),

    getTicketQueue: build.query<
      QueueResponse,
      {
        page?: number;
        status?: string;
        assignedToMe?: boolean;
        unassigned?: boolean;
      }
    >({
      query: ({
        page = 1,
        status = 'all',
        assignedToMe = false,
        unassigned = false
      } = {}) => ({
        url: '/staff-inbox/queue',
        params: { page, status, assignedToMe, unassigned }
      }),
      providesTags: ['StaffInboxTicket']
    }),

    getQueueCount: build.query<QueueCountResponse, void>({
      query: () => '/staff-inbox/queue/count',
      providesTags: ['StaffInboxTicket']
    }),

    getTicket: build.query<TicketResponse, number>({
      query: (id) => `/staff-inbox/tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'StaffInboxTicket', id }]
    }),

    replyToTicket: build.mutation<
      { id: number; body: string; createdAt: string },
      { id: number } & ReplyBody
    >({
      query: ({ id, ...body }) => ({
        url: `/staff-inbox/tickets/${id}/reply`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'StaffInboxTicket', id },
        'StaffInboxTicket'
      ]
    }),

    resolveTicket: build.mutation<void, number>({
      query: (id) => ({
        url: `/staff-inbox/tickets/${id}/resolve`,
        method: 'POST'
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'StaffInboxTicket', id },
        'StaffInboxTicket'
      ]
    }),

    unresolveTicket: build.mutation<void, number>({
      query: (id) => ({
        url: `/staff-inbox/tickets/${id}/unresolve`,
        method: 'POST'
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'StaffInboxTicket', id },
        'StaffInboxTicket'
      ]
    }),

    assignTicket: build.mutation<void, { id: number } & AssignBody>({
      query: ({ id, ...body }) => ({
        url: `/staff-inbox/tickets/${id}/assign`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'StaffInboxTicket', id },
        'StaffInboxTicket'
      ]
    }),

    bulkResolveTickets: build.mutation<BulkResolveResponse, BulkResolveBody>({
      query: (body) => ({
        url: '/staff-inbox/bulk-resolve',
        method: 'POST',
        body
      }),
      invalidatesTags: ['StaffInboxTicket']
    })
  })
});

export const {
  useGetCannedResponsesQuery,
  useCreateCannedResponseMutation,
  useUpdateCannedResponseMutation,
  useDeleteCannedResponseMutation,
  useGetMyTicketCountQuery,
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useGetTicketQueueQuery,
  useGetQueueCountQuery,
  useGetTicketQuery,
  useReplyToTicketMutation,
  useResolveTicketMutation,
  useUnresolveTicketMutation,
  useAssignTicketMutation,
  useBulkResolveTicketsMutation
} = staffInboxApi;
