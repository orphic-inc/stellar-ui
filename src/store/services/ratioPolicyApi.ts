import { api } from '../api';
import type { paths } from '../../types/api';

type RatioPolicyState =
  paths['/ratio-policy/{userId}']['get']['responses'][200]['content']['application/json'];
type OverrideBody = NonNullable<
  paths['/ratio-policy/{userId}/override']['post']['requestBody']
>['content']['application/json'];

export const ratioPolicyApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRatioPolicy: build.query<RatioPolicyState, number>({
      query: (userId) => `/ratio-policy/${userId}`,
      providesTags: (_, __, userId) => [{ type: 'RatioPolicy', id: userId }]
    }),
    overrideRatioPolicy: build.mutation<
      RatioPolicyState,
      { userId: number } & OverrideBody
    >({
      query: ({ userId, ...body }) => ({
        url: `/ratio-policy/${userId}/override`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_, __, { userId }) => [
        { type: 'RatioPolicy', id: userId }
      ]
    })
  })
});

export const { useGetRatioPolicyQuery, useOverrideRatioPolicyMutation } =
  ratioPolicyApi;
