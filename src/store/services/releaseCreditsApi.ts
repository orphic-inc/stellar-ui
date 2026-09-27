import { api } from '../api';
import type { components, paths } from '../../types/api';

/**
 * Artist credits on a release (#388, stellar-api#721). Its own service rather
 * than more endpoints in `communityApi`, whose `endpoints` is already past
 * Codacy's function-size limit.
 *
 * Every mutation invalidates the release, which is also what the release's
 * history query provides, so the credits list and the history both refresh.
 */

export type ReleaseCredit = components['schemas']['ReleaseCredit'];
export type ArtistRole = ReleaseCredit['role'];

type CreditsPath =
  paths['/communities/{communityId}/releases/{releaseId}/credits'];
type CreditPath =
  paths['/communities/{communityId}/releases/{releaseId}/credits/{creditId}'];

type AddCreditResponse =
  paths['/communities/{communityId}/releases/{releaseId}/credits']['post']['responses'][201]['content']['application/json'];
type ChangeRoleResponse =
  paths['/communities/{communityId}/releases/{releaseId}/credits/{creditId}']['patch']['responses'][200]['content']['application/json'];

type ReleaseArgs = { communityId: number; releaseId: number };
type CreditArgs = ReleaseArgs & { creditId: number };

type AddCreditBody = NonNullable<
  CreditsPath['post']['requestBody']
>['content']['application/json'];
type ChangeRoleBody = NonNullable<
  CreditPath['patch']['requestBody']
>['content']['application/json'];

const invalidateRelease = (
  _result: unknown,
  _error: unknown,
  { releaseId }: ReleaseArgs
) => [{ type: 'Release' as const, id: releaseId }];

export const releaseCreditsApi = api.injectEndpoints({
  endpoints: (build) => ({
    addReleaseCredit: build.mutation<
      AddCreditResponse,
      ReleaseArgs & AddCreditBody
    >({
      query: ({ communityId, releaseId, ...body }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/credits`,
        method: 'POST',
        body
      }),
      invalidatesTags: invalidateRelease
    }),
    changeReleaseCreditRole: build.mutation<
      ChangeRoleResponse,
      CreditArgs & ChangeRoleBody
    >({
      query: ({ communityId, releaseId, creditId, ...body }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/credits/${creditId}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: invalidateRelease
    }),
    removeReleaseCredit: build.mutation<void, CreditArgs>({
      query: ({ communityId, releaseId, creditId }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/credits/${creditId}`,
        method: 'DELETE'
      }),
      invalidatesTags: invalidateRelease
    })
  })
});

export const {
  useAddReleaseCreditMutation,
  useChangeReleaseCreditRoleMutation,
  useRemoveReleaseCreditMutation
} = releaseCreditsApi;
