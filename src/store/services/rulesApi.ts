import { api } from '../api';
import type { paths } from '../../types/api';

// The composable Rule/SubRule tree plus the resolved ${...} variables map the UI
// substitutes into the verbatim bodies (PRD-09 / ADR-0020). Derived from the
// generated contract — `rules` is the verbatim tree, `variables` is token→value.
export type RulesTreeResponse =
  paths['/rules/tree']['get']['responses'][200]['content']['application/json'];
export type RuleNode = RulesTreeResponse['rules'][number];
export type SubRuleNode = RuleNode['subRules'][number];

export interface RulesPageAuthor {
  id: number;
  username: string;
}

export interface RulesPage {
  id: number;
  slug: string;
  title: string;
  body: string;
  isMain: boolean;
  sortOrder: number;
  authorId: number;
  author: RulesPageAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface RulesIndex {
  main: RulesPage | null;
  pages: RulesPage[];
}

export interface CreateRulesPageArgs {
  title: string;
  slug?: string;
  body: string;
  isMain?: boolean;
  sortOrder?: number;
}

export interface UpdateRulesPageArgs {
  id: number;
  title?: string;
  body?: string;
  isMain?: boolean;
  sortOrder?: number;
}

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
    createRulesPage: build.mutation<RulesPage, CreateRulesPageArgs>({
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
