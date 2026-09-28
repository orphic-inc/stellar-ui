import { api } from '../api';
import type { paths } from '../../types/api';

/**
 * Staff set or clear a contribution's Freepass / Neutralpass (#392,
 * stellar-api#728). Its own service rather than another endpoint in
 * `communityApi`, whose `endpoints` is already past Codacy's function-size
 * limit.
 *
 * Invalidates `'Contribution'`, which refreshes the release page's edition
 * rows and their badge, and the release itself, which is what its history
 * query provides once a change writes a history row (stellar-api#732).
 */

type RatioExemptPath = paths['/contributions/{id}/ratio-exempt']['put'];

type SetRatioExemptResponse =
  paths['/contributions/{id}/ratio-exempt']['put']['responses'][200]['content']['application/json'];
type SetRatioExemptBody = NonNullable<
  RatioExemptPath['requestBody']
>['content']['application/json'];

type SetRatioExemptArgs = SetRatioExemptBody & {
  contributionId: number;
  // Not sent: names the release whose history the change lands in.
  releaseId: number;
};

export const ratioExemptApi = api.injectEndpoints({
  endpoints: (build) => ({
    setContributionRatioExempt: build.mutation<
      SetRatioExemptResponse,
      SetRatioExemptArgs
    >({
      query: ({ contributionId, ratioExempt }) => ({
        url: `/contributions/${contributionId}/ratio-exempt`,
        method: 'PUT',
        body: { ratioExempt }
      }),
      invalidatesTags: (_result, _error, { releaseId }) => [
        'Contribution',
        { type: 'Release', id: releaseId }
      ]
    })
  })
});

export const { useSetContributionRatioExemptMutation } = ratioExemptApi;
