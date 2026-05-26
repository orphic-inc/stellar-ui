import { api } from '../api';
import type { paths, components } from '../../types/api';
import type { RatioStats } from '../../types';

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

type DonorRewardsResponse = components['schemas']['DonorRewards'];
type UpdateDonorRewardsArgs = NonNullable<
  paths['/profile/me/donor-rewards']['put']['requestBody']
>['content']['application/json'];
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
      invalidatesTags: ['Profile']
    }),
    getMyRatioStats: build.query<RatioStats, void>({
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
  useGetMyRatioStatsQuery,
  useGetDonorRewardsQuery,
  useUpdateDonorRewardsMutation,
  useUpdateDonorForumTitleMutation
} = profileApi;
