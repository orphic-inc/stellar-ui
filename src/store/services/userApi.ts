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
type CreateUserRankArgs = NonNullable<
  paths['/tools/user-ranks']['post']['requestBody']
>['content']['application/json'];
type UpdateUserRankBody = NonNullable<
  paths['/tools/user-ranks/{id}']['put']['requestBody']
>['content']['application/json'];
type UpdateUserRankArgs = { id: number } & UpdateUserRankBody;
type StaffGroupsResponse =
  paths['/tools/staff-groups']['get']['responses'][200]['content']['application/json'];
type PermissionCatalogResponse =
  paths['/tools/user-ranks/permissions']['get']['responses'][200]['content']['application/json'];

export interface UserRankRecord {
  id: number;
  name: string;
  level: number;
  permissions: Record<string, boolean> | null;
  secondary?: boolean;
  permittedForumIds?: number[];
  color?: string | null;
  badge?: string | null;
  personalCollageLimit?: number | null;
  displayStaff?: boolean;
  staffGroupId?: number | null;
  primaryUserCount?: number;
  secondaryUserCount?: number;
  userCount?: number;
}

export interface UserRankAssignment {
  userRankId: number;
  secondaryRankIds: number[];
}

type SetUserRankArgs = {
  id: number;
  userRankId: number;
  secondaryRankIds?: number[];
};

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
    getUserRanks: build.query<UserRankRecord[], void>({
      query: () => '/tools/user-ranks',
      providesTags: ['UserRank']
    }),
    getPermissionCatalog: build.query<PermissionCatalogResponse, void>({
      query: () => '/tools/user-ranks/permissions'
    }),
    getUserRankById: build.query<UserRankRecord, number | string>({
      query: (id) => `/tools/user-ranks/${id}`,
      providesTags: (_, __, id) => [{ type: 'UserRank', id: Number(id) }]
    }),
    createUserRank: build.mutation<
      UserRankRecord,
      CreateUserRankArgs & {
        secondary?: boolean;
        permittedForumIds?: number[];
      }
    >({
      query: (data) => ({
        url: '/tools/user-ranks',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['UserRank']
    }),
    updateUserRank: build.mutation<
      UserRankRecord,
      UpdateUserRankArgs & {
        secondary?: boolean;
        permittedForumIds?: number[];
      }
    >({
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
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'Profile']
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
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'Profile']
    }),
    deleteUserNote: build.mutation<void, { id: number; noteId: number }>({
      query: ({ id, noteId }) => ({
        url: `/users/${id}/notes/${noteId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'Profile']
    }),
    disableUser: build.mutation<{ msg: string }, number>({
      query: (id) => ({ url: `/users/${id}/disable`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'User', id },
        { type: 'Profile', id },
        'Profile'
      ]
    }),
    enableUser: build.mutation<{ msg: string }, number>({
      query: (id) => ({ url: `/users/${id}/enable`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'User', id },
        { type: 'Profile', id },
        'Profile'
      ]
    }),
    getUserRankAssignment: build.query<UserRankAssignment, number>({
      query: (id) => `/users/${id}/rank`,
      providesTags: (_, __, id) => [{ type: 'User', id }]
    }),
    setUserRank: build.mutation<{ msg: string }, SetUserRankArgs>({
      query: ({ id, userRankId, secondaryRankIds = [] }) => ({
        url: `/users/${id}/rank`,
        method: 'PUT',
        body: { userRankId, secondaryRankIds }
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'Profile']
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
        color: string | null;
        expiresAfterDays: number | null;
        perks: Record<string, boolean> | null;
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
        color?: string;
        expiresAfterDays?: number;
        perks?: Record<string, boolean>;
      }
    >({
      query: (body) => ({ url: '/users/donor-ranks', method: 'POST', body }),
      invalidatesTags: ['User']
    }),
    updateDonorRank: build.mutation<
      { id: number; name: string },
      {
        rankId: number;
        name?: string;
        minDonation?: number;
        badge?: string;
        color?: string;
        expiresAfterDays?: number;
        perks?: Record<string, boolean>;
      }
    >({
      query: ({ rankId, ...body }) => ({
        url: `/users/donor-ranks/${rankId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['User']
    }),
    deleteDonorRank: build.mutation<void, number>({
      query: (rankId) => ({
        url: `/users/donor-ranks/${rankId}`,
        method: 'DELETE'
      }),
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
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'Profile']
    }),
    revokeDonor: build.mutation<{ msg: string }, number>({
      query: (id) => ({ url: `/users/${id}/donor`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'User', id }, 'Profile']
    }),
    removeUserWarning: build.mutation<void, { id: number; warnId: number }>({
      query: ({ id, warnId }) => ({
        url: `/users/${id}/warnings/${warnId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'Profile']
    }),
    getAllWarnings: build.query<
      paths['/users/warnings']['get']['responses'][200]['content']['application/json'],
      { page?: number; userId?: number }
    >({
      query: ({ page = 1, userId } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (userId) params.set('userId', String(userId));
        return `/users/warnings?${params}`;
      },
      providesTags: ['Warning']
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
    }),

    // Staff recovery queue
    getRecoveryRequests: build.query<
      paths['/users/recovery-requests']['get']['responses'][200]['content']['application/json'],
      { page?: number; status?: 'pending' | 'used' | 'expired' }
    >({
      query: ({ page = 1, status = 'pending' }) =>
        `/users/recovery-requests?page=${page}&status=${status}`,
      providesTags: ['RecoveryRequest']
    }),
    revokeRecoveryRequest: build.mutation<
      paths['/users/recovery-requests/{reqId}']['delete']['responses'][200]['content']['application/json'],
      number
    >({
      query: (id) => ({
        url: `/users/recovery-requests/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['RecoveryRequest']
    }),
    triggerUserRecovery: build.mutation<
      paths['/users/{id}/recovery']['post']['responses'][200]['content']['application/json'],
      number
    >({
      query: (userId) => ({ url: `/users/${userId}/recovery`, method: 'POST' })
    }),

    // Staff groups (admin-only CRUD, lives here alongside rank mutations)
    getStaffGroups: build.query<StaffGroupsResponse, void>({
      query: () => '/tools/staff-groups',
      providesTags: ['StaffGroup']
    }),
    createStaffGroup: build.mutation<
      paths['/tools/staff-groups']['post']['responses'][201]['content']['application/json'],
      NonNullable<
        paths['/tools/staff-groups']['post']['requestBody']
      >['content']['application/json']
    >({
      query: (body) => ({ url: '/tools/staff-groups', method: 'POST', body }),
      invalidatesTags: ['StaffGroup']
    }),
    updateStaffGroup: build.mutation<
      paths['/tools/staff-groups/{id}']['put']['responses'][200]['content']['application/json'],
      { id: number } & NonNullable<
        paths['/tools/staff-groups/{id}']['put']['requestBody']
      >['content']['application/json']
    >({
      query: ({ id, ...body }) => ({
        url: `/tools/staff-groups/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['StaffGroup']
    }),
    deleteStaffGroup: build.mutation<void, number>({
      query: (id) => ({ url: `/tools/staff-groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['StaffGroup']
    }),

    // Staff bio (admin-only, per-user)
    setStaffBio: build.mutation<
      paths['/users/{id}/staff-bio']['put']['responses'][200]['content']['application/json'],
      { id: number; staffBio: string | null }
    >({
      query: ({ id, staffBio }) => ({
        url: `/users/${id}/staff-bio`,
        method: 'PUT',
        body: { staffBio }
      }),
      invalidatesTags: (_, __, { id }) => [
        'StaffGroup',
        { type: 'User', id },
        { type: 'Profile', id },
        'Profile'
      ]
    })
  })
});

export const {
  useGetUserByIdQuery,
  useGetPermissionCatalogQuery,
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
  useGetUserRankAssignmentQuery,
  useSetUserRankMutation,
  useGetUserIpHistoryQuery,
  useGetUserEmailHistoryQuery,
  useGetSnatchListQuery,
  useGetDonorRanksQuery,
  useCreateDonorRankMutation,
  useUpdateDonorRankMutation,
  useDeleteDonorRankMutation,
  useGrantDonorMutation,
  useRevokeDonorMutation,
  useRemoveUserWarningMutation,
  useGetSnatchListByUserIdQuery,
  useGetRecoveryRequestsQuery,
  useRevokeRecoveryRequestMutation,
  useTriggerUserRecoveryMutation,
  useGetStaffGroupsQuery,
  useCreateStaffGroupMutation,
  useUpdateStaffGroupMutation,
  useDeleteStaffGroupMutation,
  useSetStaffBioMutation,
  useGetAllWarningsQuery
} = userApi;
