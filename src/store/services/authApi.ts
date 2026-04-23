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
    })
  })
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation
} = authApi;
