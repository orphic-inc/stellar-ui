import { api } from '../api';
import type { paths } from '../../types/api';

type PublicUserResponse =
  paths['/users/{id}']['get']['responses'][200]['content']['application/json'];
type UserSettingsResponse =
  paths['/users/settings']['get']['responses'][200]['content']['application/json'];
type UpdateUserSettingsArgs = NonNullable<
  paths['/users/settings']['put']['requestBody']
>['content']['application/json'];
type UpdateUserSettingsResponse =
  paths['/users/settings']['put']['responses'][200]['content']['application/json'];
type CreateUserArgs = NonNullable<
  paths['/users']['post']['requestBody']
>['content']['application/json'];
type CreateUserResponse =
  paths['/users']['post']['responses'][201]['content']['application/json'];
type UserRanksResponse =
  paths['/tools/user-ranks']['get']['responses'][200]['content']['application/json'];
type UserRankResponse =
  paths['/tools/user-ranks/{id}']['get']['responses'][200]['content']['application/json'];
type CreateUserRankArgs = NonNullable<
  paths['/tools/user-ranks']['post']['requestBody']
>['content']['application/json'];
type CreateUserRankResponse =
  paths['/tools/user-ranks']['post']['responses'][201]['content']['application/json'];
type UpdateUserRankBody = NonNullable<
  paths['/tools/user-ranks/{id}']['put']['requestBody']
>['content']['application/json'];
type UpdateUserRankArgs = { id: number } & UpdateUserRankBody;
type UpdateUserRankResponse =
  paths['/tools/user-ranks/{id}']['put']['responses'][200]['content']['application/json'];

export const userApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUserById: build.query<PublicUserResponse, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    getUserSettings: build.query<UserSettingsResponse, void>({
      query: () => '/users/settings',
      providesTags: ['User']
    }),
    updateUserSettings: build.mutation<
      UpdateUserSettingsResponse,
      UpdateUserSettingsArgs
    >({
      query: (data) => ({ url: '/users/settings', method: 'PUT', body: data }),
      invalidatesTags: ['User', 'Auth']
    }),
    createUser: build.mutation<CreateUserResponse, CreateUserArgs>({
      query: (data) => ({ url: '/users', method: 'POST', body: data }),
      invalidatesTags: ['User']
    }),

    // UserRanks (UserRank)
    getUserRanks: build.query<UserRanksResponse, void>({
      query: () => '/tools/user-ranks',
      providesTags: ['UserRank']
    }),
    getUserRankById: build.query<UserRankResponse, number | string>({
      query: (id) => `/tools/user-ranks/${id}`,
      providesTags: (_, __, id) => [{ type: 'UserRank', id: Number(id) }]
    }),
    createUserRank: build.mutation<CreateUserRankResponse, CreateUserRankArgs>({
      query: (data) => ({
        url: '/tools/user-ranks',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['UserRank']
    }),
    updateUserRank: build.mutation<UpdateUserRankResponse, UpdateUserRankArgs>({
      query: ({ id, ...data }) => ({
        url: `/tools/user-ranks/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'UserRank', id }, 'UserRank']
    }),
    deleteUserRank: build.mutation<void, number>({
      query: (id) => ({ url: `/tools/user-ranks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['UserRank']
    }),

    // Staff user actions
    warnUser: build.mutation<
      { msg: string },
      { id: number; reason: string; expiresAt?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/warn`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }]
    }),
    getUserWarnings: build.query<
      Array<{
        id: number;
        reason: string;
        expiresAt: string | null;
        createdAt: string;
        warnedBy: { id: number; username: string } | null;
      }>,
      number
    >({
      query: (id) => `/users/${id}/warnings`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    getUserNotes: build.query<
      Array<{
        id: number;
        body: string;
        createdAt: string;
        author: { id: number; username: string } | null;
      }>,
      number
    >({
      query: (id) => `/users/${id}/notes`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    addUserNote: build.mutation<{ msg: string }, { id: number; body: string }>({
      query: ({ id, body }) => ({
        url: `/users/${id}/notes`,
        method: 'POST',
        body: { body }
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }]
    }),
    deleteUserNote: build.mutation<void, { id: number; noteId: number }>({
      query: ({ id, noteId }) => ({
        url: `/users/${id}/notes/${noteId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }]
    }),
    disableUser: build.mutation<{ msg: string }, number>({
      query: (id) => ({ url: `/users/${id}/disable`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    enableUser: build.mutation<{ msg: string }, number>({
      query: (id) => ({ url: `/users/${id}/enable`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    setUserRank: build.mutation<
      { msg: string },
      { id: number; userRankId: number }
    >({
      query: ({ id, userRankId }) => ({
        url: `/users/${id}/rank`,
        method: 'PUT',
        body: { userRankId }
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }]
    }),
    getUserIpHistory: build.query<
      Array<{ ip: string; seenAt: string }>,
      number
    >({
      query: (id) => `/users/${id}/ip-history`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    getUserEmailHistory: build.query<
      Array<{ email: string; changedAt: string }>,
      number
    >({
      query: (id) => `/users/${id}/email-history`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),

    // Snatch list
    getSnatchList: build.query<
      Array<{
        id: number;
        release: { id: number; title: string; communityId: number | null };
        artist: { name: string } | null;
        downloadedAt: string;
      }>,
      void
    >({
      query: () => '/users/me/snatch-list',
      providesTags: ['User']
    }),

    // Donor ranks
    getDonorRanks: build.query<
      Array<{
        id: number;
        name: string;
        minDonation: number;
        badge: string | null;
        expiresAfterDays: number | null;
      }>,
      void
    >({
      query: () => '/users/donor-ranks',
      providesTags: ['User']
    }),
    createDonorRank: build.mutation<
      { id: number; name: string },
      {
        name: string;
        minDonation: number;
        badge?: string;
        expiresAfterDays?: number;
      }
    >({
      query: (body) => ({ url: '/users/donor-ranks', method: 'POST', body }),
      invalidatesTags: ['User']
    }),
    grantDonor: build.mutation<
      { msg: string },
      { id: number; donorRankId: number; expiresAt?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/donor`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }]
    }),
    revokeDonor: build.mutation<{ msg: string }, number>({
      query: (id) => ({ url: `/users/${id}/donor`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    removeUserWarning: build.mutation<void, { id: number; warnId: number }>({
      query: ({ id, warnId }) => ({
        url: `/users/${id}/warnings/${warnId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }]
    }),
    getSnatchListByUserId: build.query<
      Array<{
        id: number;
        release: { id: number; title: string; communityId: number | null };
        artist: { name: string } | null;
        downloadedAt: string;
      }>,
      number
    >({
      query: (id) => `/users/${id}/snatch-list`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    })
  })
});

export const {
  useGetUserByIdQuery,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  useCreateUserMutation,
  useGetUserRanksQuery,
  useGetUserRankByIdQuery,
  useCreateUserRankMutation,
  useUpdateUserRankMutation,
  useDeleteUserRankMutation,
  useWarnUserMutation,
  useGetUserWarningsQuery,
  useGetUserNotesQuery,
  useAddUserNoteMutation,
  useDeleteUserNoteMutation,
  useDisableUserMutation,
  useEnableUserMutation,
  useSetUserRankMutation,
  useGetUserIpHistoryQuery,
  useGetUserEmailHistoryQuery,
  useGetSnatchListQuery,
  useGetDonorRanksQuery,
  useCreateDonorRankMutation,
  useGrantDonorMutation,
  useRevokeDonorMutation,
  useRemoveUserWarningMutation,
  useGetSnatchListByUserIdQuery
} = userApi;
