import { api } from '../api';
import type { paths } from '../../types/api';

type GrantResult =
  paths['/contributions/{id}/access']['post']['responses'][200]['content']['application/json'];
type ReverseGrantResult =
  paths['/downloads/{grantId}/reverse']['post']['responses'][200]['content']['application/json'];

export const downloadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    grantAccess: builder.mutation<
      GrantResult,
      { contributionId: number; idempotencyKey?: string }
    >({
      query: ({ contributionId, idempotencyKey }) => ({
        url: `/contributions/${contributionId}/access`,
        method: 'POST',
        body: idempotencyKey ? { idempotencyKey } : {}
      }),
      invalidatesTags: ['Contribution']
    }),

    reverseGrant: builder.mutation<
      ReverseGrantResult,
      { grantId: number; reason?: string }
    >({
      query: ({ grantId, reason }) => ({
        url: `/downloads/${grantId}/reverse`,
        method: 'POST',
        body: reason ? { reason } : {}
      }),
      invalidatesTags: ['Download', 'Contribution']
    }),

    reportContribution: builder.mutation<
      { msg: string },
      { contributionId: number; reason: string }
    >({
      query: ({ contributionId, reason }) => ({
        url: `/contributions/${contributionId}/report`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: ['Contribution']
    })
  })
});

export const {
  useGrantAccessMutation,
  useReverseGrantMutation,
  useReportContributionMutation
} = downloadApi;
