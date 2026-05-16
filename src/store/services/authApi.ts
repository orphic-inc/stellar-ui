import { api } from '../api';
import { setCredentials, logout as logoutAction } from '../slices/authSlice';
import type { components, paths } from '../../types/api';

type LoginArgs = components['schemas']['LoginBody'];
type RegisterArgs = components['schemas']['RegisterBody'];
type CurrentUserResponse =
  paths['/auth']['get']['responses'][200]['content']['application/json'];
type LoginResponse =
  paths['/auth']['post']['responses'][200]['content']['application/json'];
type RegisterResponse =
  paths['/auth/register']['post']['responses'][200]['content']['application/json'];

export interface SessionItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<CurrentUserResponse, void>({
      query: () => '/auth',
      providesTags: ['Auth'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (err: unknown) {
          const status = (err as { status?: number })?.status;
          if (status === 401 || status === 403) {
            dispatch(logoutAction());
          }
        }
      }
    }),
    login: build.mutation<LoginResponse, LoginArgs>({
      query: (credentials) => ({
        url: '/auth',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data.user));
        } catch {
          // login component handles the error display
        }
      }
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' })
    }),
    register: build.mutation<RegisterResponse, RegisterArgs>({
      query: (data) => ({ url: '/auth/register', method: 'POST', body: data }),
      invalidatesTags: ['Auth']
    }),

    // Password / email changes
    changePassword: build.mutation<
      { msg: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({ url: '/auth/password', method: 'POST', body })
    }),
    changeEmail: build.mutation<
      { msg: string },
      { newEmail: string; password: string }
    >({
      query: (body) => ({ url: '/auth/email', method: 'PUT', body }),
      invalidatesTags: ['Auth']
    }),

    // Recovery
    requestRecovery: build.mutation<{ msg: string }, { email: string }>({
      query: (body) => ({ url: '/auth/recovery/request', method: 'POST', body })
    }),
    resetPassword: build.mutation<
      { msg: string },
      { token: string; newPassword: string }
    >({
      query: (body) => ({ url: '/auth/recovery/reset', method: 'POST', body })
    }),

    // Sessions
    getSessions: build.query<SessionItem[], void>({
      query: () => '/auth/sessions',
      providesTags: ['Auth']
    }),
    revokeSession: build.mutation<void, string>({
      query: (id) => ({ url: `/auth/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Auth']
    })
  })
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useRequestRecoveryMutation,
  useResetPasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation
} = authApi;
