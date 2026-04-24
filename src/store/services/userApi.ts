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
