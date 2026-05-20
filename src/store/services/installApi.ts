import { api } from '../api';
import type { AuthUser } from '../../types';

export interface LaunchChecklistItem {
  id: string;
  message: string;
}

interface InstallStatus {
  installed: boolean;
  registrationStatus: 'open' | 'invite' | 'closed';
  configWarnings: string[];
  setupChecklist: LaunchChecklistItem[];
}

interface InstallArgs {
  username: string;
  email: string;
  password: string;
}

interface InstallResponse {
  user: AuthUser;
}

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
