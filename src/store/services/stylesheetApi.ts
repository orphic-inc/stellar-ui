import { api } from '../api';
import type { paths } from '../../types/api';

// A member's own stylesheets (#450; stellar-api ADR-0032). The list carries
// metadata only; `source` is read one sheet at a time, for the editor.
type AuthorStylesheetList =
  paths['/stylesheet/author/{userId}']['get']['responses'][200]['content']['application/json'];
export type AuthorStylesheetListItem = AuthorStylesheetList['data'][number];
export type AuthorStylesheet =
  paths['/stylesheet/author-stylesheet/{id}']['get']['responses'][200]['content']['application/json'];
type AdoptionResult =
  paths['/stylesheet/author-stylesheet/{id}/adopt']['post']['responses'][200]['content']['application/json'];
export type AuthorStylesheetBody = NonNullable<
  paths['/stylesheet/author']['post']['requestBody']
>['content']['application/json'];

export const stylesheetApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAuthorStylesheets: build.query<
      AuthorStylesheetList,
      { userId: number; page?: number }
    >({
      query: ({ userId, page = 1 }) =>
        `/stylesheet/author/${userId}?page=${page}`,
      providesTags: ['AuthorStylesheet']
    }),
    getAuthorStylesheet: build.query<AuthorStylesheet, number>({
      query: (id) => `/stylesheet/author-stylesheet/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'AuthorStylesheet', id }]
    }),
    createAuthorStylesheet: build.mutation<
      AuthorStylesheet,
      AuthorStylesheetBody
    >({
      query: (body) => ({ url: '/stylesheet/author', method: 'POST', body }),
      invalidatesTags: ['AuthorStylesheet']
    }),
    updateAuthorStylesheet: build.mutation<
      AuthorStylesheet,
      { id: number } & AuthorStylesheetBody
    >({
      query: ({ id, ...body }) => ({
        url: `/stylesheet/author-stylesheet/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['AuthorStylesheet']
    }),
    // The injector and Settings read the adopted id off the profile, so the
    // profile refetches and the page re-themes (#451).
    adoptAuthorStylesheet: build.mutation<AdoptionResult, number>({
      query: (id) => ({
        url: `/stylesheet/author-stylesheet/${id}/adopt`,
        method: 'POST'
      }),
      invalidatesTags: ['Profile']
    }),
    deleteAuthorStylesheet: build.mutation<void, number>({
      query: (id) => ({
        url: `/stylesheet/author-stylesheet/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['AuthorStylesheet']
    })
  })
});

export const {
  useListAuthorStylesheetsQuery,
  useGetAuthorStylesheetQuery,
  useCreateAuthorStylesheetMutation,
  useUpdateAuthorStylesheetMutation,
  useAdoptAuthorStylesheetMutation,
  useDeleteAuthorStylesheetMutation
} = stylesheetApi;
