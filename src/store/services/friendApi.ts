import { api } from '../api';
import type { paths } from '../../types/api';

type FriendsListResponse =
  paths['/friends']['get']['responses'][200]['content']['application/json'];

type FriendStatusResponse =
  paths['/friends/status/{userId}']['get']['responses'][200]['content']['application/json'];

type UpdateCommentArgs = {
  userId: number;
  comment: string;
};

export const friendApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyFriends: build.query<FriendsListResponse, number>({
      query: (page) => `/friends?page=${page}`,
      providesTags: [{ type: 'Friend', id: 'LIST' }]
    }),
    getFriendStatus: build.query<FriendStatusResponse, number>({
      query: (userId) => `/friends/status/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'Friend', id: userId }]
    }),
    addFriend: build.mutation<void, number>({
      query: (userId) => ({ url: `/friends/${userId}`, method: 'POST' }),
      invalidatesTags: (_r, _e, userId) => [
        { type: 'Friend', id: 'LIST' },
        { type: 'Friend', id: userId }
      ]
    }),
    removeFriend: build.mutation<void, number>({
      query: (userId) => ({ url: `/friends/${userId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, userId) => [
        { type: 'Friend', id: 'LIST' },
        { type: 'Friend', id: userId }
      ]
    }),
    updateFriendComment: build.mutation<void, UpdateCommentArgs>({
      query: ({ userId, comment }) => ({
        url: `/friends/${userId}/comment`,
        method: 'PUT',
        body: { comment }
      }),
      invalidatesTags: [{ type: 'Friend', id: 'LIST' }]
    })
  })
});

export const {
  useGetMyFriendsQuery,
  useGetFriendStatusQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
  useUpdateFriendCommentMutation
} = friendApi;
