import { api } from '../api';
import type { paths } from '../../types/api';

type TagAliasListResponse =
  paths['/tag-aliases']['get']['responses'][200]['content']['application/json'];
type CreateTagAliasArgs = NonNullable<
  paths['/tag-aliases']['post']['requestBody']
>['content']['application/json'];
type CreateTagAliasResponse =
  paths['/tag-aliases']['post']['responses'][201]['content']['application/json'];
type UpdateTagAliasArgs = NonNullable<
  paths['/tag-aliases/{id}']['put']['requestBody']
>['content']['application/json'];
type UpdateTagAliasResponse =
  paths['/tag-aliases/{id}']['put']['responses'][200]['content']['application/json'];

export const tagAliasApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTagAliases: build.query<TagAliasListResponse, { page?: number }>({
      query: ({ page = 1 } = {}) => `/tag-aliases?page=${page}`,
      providesTags: ['TagAlias']
    }),
    createTagAlias: build.mutation<CreateTagAliasResponse, CreateTagAliasArgs>({
      query: (body) => ({ url: '/tag-aliases', method: 'POST', body }),
      invalidatesTags: ['TagAlias']
    }),
    updateTagAlias: build.mutation<
      UpdateTagAliasResponse,
      { id: number } & UpdateTagAliasArgs
    >({
      query: ({ id, ...body }) => ({
        url: `/tag-aliases/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['TagAlias']
    }),
    deleteTagAlias: build.mutation<void, number>({
      query: (id) => ({ url: `/tag-aliases/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TagAlias']
    })
  })
});

export const {
  useGetTagAliasesQuery,
  useCreateTagAliasMutation,
  useUpdateTagAliasMutation,
  useDeleteTagAliasMutation
} = tagAliasApi;
