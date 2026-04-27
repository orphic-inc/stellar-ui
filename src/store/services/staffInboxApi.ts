import { api } from '../api';
import type { paths } from '../../types/api';

type ResponsesResponse =
  paths['/staff-inbox/responses']['get']['responses'][200]['content']['application/json'];
type CreateResponseBody = NonNullable<
  paths['/staff-inbox/responses']['post']['requestBody']
>['content']['application/json'];
type UpdateResponseBody = NonNullable<
  paths['/staff-inbox/responses/{id}']['put']['requestBody']
>['content']['application/json'];

export const staffInboxApi = api.injectEndpoints({
  endpoints: (build) => ({
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
  useGetCannedResponsesQuery,
  useCreateCannedResponseMutation,
  useUpdateCannedResponseMutation,
  useDeleteCannedResponseMutation
} = staffInboxApi;
