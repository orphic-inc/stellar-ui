import { api } from '../api';
import type { UserSettings, Permission, AuthUser } from '../../types';

interface CreateUserArgs {
  username: string;
  email: string;
  password: string;
}
interface UpdatePermissionArgs {
  id: number;
  level?: number;
  name?: string;
  permissions?: Record<string, boolean>;
}

export const userApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUserById: build.query<AuthUser, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    getUserSettings: build.query<UserSettings, void>({
      query: () => '/users/settings',
      providesTags: ['User']
    }),
    updateUserSettings: build.mutation<UserSettings, Partial<UserSettings>>({
      query: (data) => ({ url: '/users/settings', method: 'PUT', body: data }),
      invalidatesTags: ['User', 'Auth']
    }),
    createUser: build.mutation<AuthUser, CreateUserArgs>({
      query: (data) => ({ url: '/users', method: 'POST', body: data }),
      invalidatesTags: ['User']
    }),

    // Permissions (UserRank)
    getPermissions: build.query<Permission[], void>({
      query: () => '/tools/permissions',
      providesTags: ['Permission']
    }),
    getPermissionById: build.query<Permission, number | string>({
      query: (id) => `/tools/permissions/${id}`,
      providesTags: (_, __, id) => [{ type: 'Permission', id: Number(id) }]
    }),
    createPermission: build.mutation<
      Permission,
      Omit<Permission, 'id' | 'userCount'>
    >({
      query: (data) => ({
        url: '/tools/permissions',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Permission']
    }),
    updatePermission: build.mutation<Permission, UpdatePermissionArgs>({
      query: ({ id, ...data }) => ({
        url: `/tools/permissions/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Permission', id },
        'Permission'
      ]
    }),
    deletePermission: build.mutation<void, number>({
      query: (id) => ({ url: `/tools/permissions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Permission']
    })
  })
});

export const {
  useGetUserByIdQuery,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  useCreateUserMutation,
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation
} = userApi;
