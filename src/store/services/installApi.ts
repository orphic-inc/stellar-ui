import { api } from '../api';
import type { paths } from '../../types/api';

type InstallStatus =
  paths['/install']['get']['responses'][200]['content']['application/json'];
export type LaunchChecklistItem = InstallStatus['setupChecklist'][number];
type InstallArgs = NonNullable<
  paths['/install']['post']['requestBody']
>['content']['application/json'];
type InstallResponse =
  paths['/install']['post']['responses'][201]['content']['application/json'];

export const installApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInstallStatus: build.query<InstallStatus, void>({
      query: () => '/install',
      providesTags: ['SiteSettings']
    }),
    install: build.mutation<InstallResponse, InstallArgs>({
      query: (data) => ({ url: '/install', method: 'POST', body: data })
    }),
    dismissInstallChecklistItem: build.mutation<void, string>({
      query: (id) => ({
        url: `/install/checklist/${id}/dismiss`,
        method: 'POST'
      }),
      invalidatesTags: ['SiteSettings']
    })
  })
});

export const {
  useGetInstallStatusQuery,
  useInstallMutation,
  useDismissInstallChecklistItemMutation
} = installApi;
