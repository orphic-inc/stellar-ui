import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from './slices/authSlice';
import type { AppDispatch } from './index';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include'
});

const baseQueryWithLogout: typeof baseQuery = async (args, api, extra) => {
  const result = await baseQuery(args, api, extra);
  if (result.error?.status === 401 || result.error?.status === 403) {
    (api.dispatch as AppDispatch)(logout());
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLogout,
  tagTypes: [
    'Auth',
    'User',
    'Profile',
    'Forum',
    'ForumCategory',
    'ForumTopic',
    'ForumPost',
    'Community',
    'Release',
    'Artist',
    'Comment',
    'Subscription',
    'Notification',
    'Announcement',
    'Stylesheet',
    'Contribution',
    'Permission',
    'Stats'
  ] as const,
  endpoints: () => ({})
});
