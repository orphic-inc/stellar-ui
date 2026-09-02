import { api } from '../api';
import type { paths } from '../../types/api';

// The composable Rule/SubRule tree plus the resolved ${...} variables map the UI
// substitutes into the verbatim bodies (PRD-09 / ADR-0020). Derived from the
// generated contract — `rules` is the verbatim tree, `variables` is token→value.
export type RulesTreeResponse =
  paths['/rules/tree']['get']['responses'][200]['content']['application/json'];
export type RuleNode = RulesTreeResponse['rules'][number];
export type SubRuleNode = RuleNode['subRules'][number];

// All four page-returning rules routes project the same `pageSelect`, so one
// shape covers the index rows, the slug read and both write echoes.
export type RulesPage =
  paths['/rules/{slug}']['get']['responses'][200]['content']['application/json'];
export type RulesPageAuthor = RulesPage['author'];
export type RulesIndex =
  paths['/rules']['get']['responses'][200]['content']['application/json'];

// Request bodies, so the admin editor's form fields cannot drift from what the
// route validates. `id` is a path param, not part of the body — same shape as
// reportsApi's resolveReport args.
type CreatedRulesPage =
  paths['/rules']['post']['responses'][201]['content']['application/json'];
export type CreateRulesPageArgs = NonNullable<
  paths['/rules']['post']['requestBody']
>['content']['application/json'];
export type UpdateRulesPageArgs = { id: number } & NonNullable<
  paths['/rules/{id}']['put']['requestBody']
>['content']['application/json'];

export const rulesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRulesIndex: build.query<RulesIndex, void>({
      query: () => '/rules',
      providesTags: ['RulesPage']
    }),
    getRulesTree: build.query<RulesTreeResponse, void>({
      query: () => '/rules/tree',
      providesTags: ['RulesPage']
    }),
    getRulesPage: build.query<RulesPage, string>({
      query: (slug) => `/rules/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'RulesPage', id: slug }]
    }),
    createRulesPage: build.mutation<CreatedRulesPage, CreateRulesPageArgs>({
      query: (body) => ({ url: '/rules', method: 'POST', body }),
      invalidatesTags: ['RulesPage']
    }),
    updateRulesPage: build.mutation<RulesPage, UpdateRulesPageArgs>({
      query: ({ id, ...body }) => ({
        url: `/rules/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['RulesPage']
    }),
    deleteRulesPage: build.mutation<void, number>({
      query: (id) => ({ url: `/rules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['RulesPage']
    })
  })
});

export const {
  useGetRulesIndexQuery,
  useGetRulesTreeQuery,
  useGetRulesPageQuery,
  useCreateRulesPageMutation,
  useUpdateRulesPageMutation,
  useDeleteRulesPageMutation
} = rulesApi;
