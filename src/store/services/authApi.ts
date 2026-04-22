import { api } from '../api';
import { setCredentials, logout as logoutAction } from '../slices/authSlice';
import type { AuthUser } from '../../types';

interface LoginArgs {
  email: string;
  password: string;
}
interface RegisterArgs {
  username: string;
  email: string;
  password: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<AuthUser, void>({
      query: () => '/auth',
      providesTags: ['Auth'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          dispatch(logoutAction());
        }
      }
    }),
    login: build.mutation<AuthUser, LoginArgs>({
      query: (credentials) => ({
        url: '/auth',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['Auth']
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logoutAction());
        }
      }
    }),
    register: build.mutation<AuthUser, RegisterArgs>({
      query: (data) => ({ url: '/users', method: 'POST', body: data })
    })
  })
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation
} = authApi;
