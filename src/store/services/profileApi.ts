import { api } from '../api';
import type { Profile } from '../../types';

interface CreateInviteArgs {
  email: string;
  reason?: string;
}

export const profileApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyProfile: build.query<Profile, void>({
      query: () => '/profile/me',
      providesTags: ['Profile']
    }),
    getProfileByUserId: build.query<Profile, number | string>({
      query: (userId) => `/profile/user/${userId}`,
      providesTags: (_, __, id) => [{ type: 'Profile', id: Number(id) }]
    }),
    updateMyProfile: build.mutation<Profile, Partial<Profile>>({
      query: (data) => ({ url: '/profile/me', method: 'PUT', body: data }),
      invalidatesTags: ['Profile', 'Auth']
    }),
    deleteMyProfile: build.mutation<void, void>({
      query: () => ({ url: '/profile', method: 'DELETE' }),
      invalidatesTags: ['Profile', 'Auth']
    }),
    createInvite: build.mutation<void, CreateInviteArgs>({
      query: (data) => ({
        url: '/profile/referral/create-invite',
        method: 'POST',
        body: data
      })
    })
  })
});

export const {
  useGetMyProfileQuery,
  useGetProfileByUserIdQuery,
  useUpdateMyProfileMutation,
  useDeleteMyProfileMutation,
  useCreateInviteMutation
} = profileApi;
