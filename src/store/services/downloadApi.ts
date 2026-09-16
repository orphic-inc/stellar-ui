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
      // 'Profile' too: a grant increments `consumed`, so the ratio and the
      // ratio policy state both move (ADR-0044 puts `OK -> WATCH` after a
      // download, and only after a download). `getMyRatioStats` provides
      // 'Profile', and it feeds the notice on the member's own profile —
      // without this the notice serves the pre-download cache (ui#334).
      // 'Auth' as well (ui#345): the session now carries the same policy state
      // (stellar-api#659) and feeds the site-wide banner.
      invalidatesTags: ['Contribution', 'Profile', 'Auth']
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
      // A reversal decrements `consumed` (stellar-api `modules/downloads.ts`),
      // so it moves the ratio in the other direction and needs 'Profile' for
      // the same reason a grant does, and 'Auth' for the banner's.
      invalidatesTags: ['Download', 'Contribution', 'Profile', 'Auth']
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
