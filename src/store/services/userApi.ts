import { api } from '../api';
import type { UserRank } from '../../types';
import type { paths } from '../../types/api';

interface UpdateUserRankArgs {
  id: number;
  level?: number;
  name?: string;
  permissions?: Record<string, boolean>;
}

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
    getUserRanks: build.query<UserRank[], void>({
      query: () => '/tools/permissions',
      providesTags: ['UserRank']
    }),
    getUserRankById: build.query<UserRank, number | string>({
      query: (id) => `/tools/permissions/${id}`,
      providesTags: (_, __, id) => [{ type: 'UserRank', id: Number(id) }]
    }),
    createUserRank: build.mutation<
      UserRank,
      Omit<UserRank, 'id' | 'userCount'>
    >({
      query: (data) => ({
        url: '/tools/permissions',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['UserRank']
    }),
    updateUserRank: build.mutation<UserRank, UpdateUserRankArgs>({
      query: ({ id, ...data }) => ({
        url: `/tools/permissions/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'UserRank', id }, 'UserRank']
    }),
    deleteUserRank: build.mutation<void, number>({
      query: (id) => ({ url: `/tools/permissions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['UserRank']
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
  useDeleteUserRankMutation
} = userApi;
