import { api } from '../api';
import type { DownloadGrant } from '../../types';

export const downloadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    grantAccess: builder.mutation<
      DownloadGrant,
      { contributionId: number; idempotencyKey?: string }
    >({
      query: ({ contributionId, idempotencyKey }) => ({
        url: `/contributions/${contributionId}/access`,
        method: 'POST',
        body: idempotencyKey ? { idempotencyKey } : {}
      }),
      invalidatesTags: ['Request']
    }),

    reverseGrant: builder.mutation<
      { grantId: number; status: string },
      { grantId: number; reason?: string }
    >({
      query: ({ grantId, reason }) => ({
        url: `/downloads/${grantId}/reverse`,
        method: 'POST',
        body: reason ? { reason } : {}
      })
    })
  })
});

export const { useGrantAccessMutation, useReverseGrantMutation } = downloadApi;
