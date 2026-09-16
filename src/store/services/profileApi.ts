import { api } from '../api';
import type { paths, components } from '../../types/api';

type MyProfileResponse =
  paths['/profile/me']['get']['responses'][200]['content']['application/json'];
type PublicProfileResponse =
  paths['/profile/user/{userId}']['get']['responses'][200]['content']['application/json'];
type UpdateMyProfileArgs = NonNullable<
  paths['/profile/me']['put']['requestBody']
>['content']['application/json'];
type CreateInviteArgs = NonNullable<
  paths['/profile/referral/create-invite']['post']['requestBody']
>['content']['application/json'];
type CreateInviteResponse =
  paths['/profile/referral/create-invite']['post']['responses'][201]['content']['application/json'];

// The member's own invite surfaces (stellar-api#637, #640).
export type InviteEligibility = components['schemas']['InviteEligibility'];
type MyInvitesResponse =
  paths['/profile/me/invites']['get']['responses'][200]['content']['application/json'];
export type OwnInviteItem = components['schemas']['OwnInviteItem'];
type WithdrawInviteResponse =
  paths['/profile/me/invites/{inviteId}/withdraw']['post']['responses'][200]['content']['application/json'];

export type DonorRewardsResponse = components['schemas']['DonorRewards'];
type UpdateDonorRewardsArgs = NonNullable<
  paths['/profile/me/donor-rewards']['put']['requestBody']
>['content']['application/json'];
// The route answers RatioStats plus the policy state (an allOf that ADDS).
type MyRatioStatsResponse =
  paths['/profile/me/ratio']['get']['responses'][200]['content']['application/json'];
type UpdateDonorForumTitleArgs = NonNullable<
  paths['/profile/me/donor-title']['put']['requestBody']
>['content']['application/json'];

export const profileApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyProfile: build.query<MyProfileResponse, void>({
      query: () => '/profile/me',
      providesTags: ['Profile']
    }),
    getProfileByUserId: build.query<PublicProfileResponse, number | string>({
      query: (userId) => `/profile/user/${userId}`,
      providesTags: (_, __, id) => [{ type: 'Profile', id: Number(id) }]
    }),
    updateMyProfile: build.mutation<MyProfileResponse, UpdateMyProfileArgs>({
      query: (data) => ({ url: '/profile/me', method: 'PUT', body: data }),
      invalidatesTags: ['Profile', 'Auth']
    }),
    deleteMyProfile: build.mutation<void, void>({
      query: () => ({ url: '/profile', method: 'DELETE' }),
      invalidatesTags: ['Profile', 'Auth']
    }),
    createInvite: build.mutation<CreateInviteResponse, CreateInviteArgs>({
      query: (data) => ({
        url: '/profile/referral/create-invite',
        method: 'POST',
        body: data
      }),
      // 'Auth' too: the session carries inviteCount, which the header reads.
      invalidatesTags: ['Profile', 'Auth', 'Invite']
    }),
    // The gates a send would apply, in the same order and the same words
    // (#637). Advisory: the POST enforces them.
    getInviteEligibility: build.query<InviteEligibility, void>({
      query: () => '/profile/me/invites/eligibility',
      providesTags: ['Invite']
    }),
    // Only invites registration would still accept; a revoked member gets none.
    getMyInvites: build.query<MyInvitesResponse, number | void>({
      query: (page) => ({
        url: '/profile/me/invites',
        params: { page: page || 1 }
      }),
      providesTags: ['Invite']
    }),
    withdrawInvite: build.mutation<WithdrawInviteResponse, number>({
      query: (inviteId) => ({
        url: `/profile/me/invites/${inviteId}/withdraw`,
        method: 'POST'
      }),
      invalidatesTags: ['Invite', 'Profile', 'Auth']
    }),
    getMyRatioStats: build.query<MyRatioStatsResponse, void>({
      query: () => '/profile/me/ratio',
      providesTags: ['Profile']
    }),
    getDonorRewards: build.query<DonorRewardsResponse, void>({
      query: () => '/profile/me/donor-rewards',
      providesTags: ['DonorReward']
    }),
    updateDonorRewards: build.mutation<
      DonorRewardsResponse,
      UpdateDonorRewardsArgs
    >({
      query: (body) => ({
        url: '/profile/me/donor-rewards',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DonorReward', 'Profile']
    }),
    updateDonorForumTitle: build.mutation<
      DonorRewardsResponse,
      UpdateDonorForumTitleArgs
    >({
      query: (body) => ({
        url: '/profile/me/donor-title',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DonorReward', 'Profile']
    })
  })
});

export const {
  useGetMyProfileQuery,
  useGetProfileByUserIdQuery,
  useUpdateMyProfileMutation,
  useDeleteMyProfileMutation,
  useCreateInviteMutation,
  useGetInviteEligibilityQuery,
  useGetMyInvitesQuery,
  useWithdrawInviteMutation,
  useGetMyRatioStatsQuery,
  useGetDonorRewardsQuery,
  useUpdateDonorRewardsMutation,
  useUpdateDonorForumTitleMutation
} = profileApi;
