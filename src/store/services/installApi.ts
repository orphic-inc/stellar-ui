import { api } from '../api';
import type { AuthUser } from '../../types';

interface InstallStatus {
  installed: boolean;
}

interface InstallArgs {
  username: string;
  email: string;
  password: string;
}

interface InstallResponse {
  user: AuthUser;
  token: string;
}

export const installApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInstallStatus: build.query<InstallStatus, void>({
      query: () => '/install'
    }),
    install: build.mutation<InstallResponse, InstallArgs>({
      query: (data) => ({ url: '/install', method: 'POST', body: data })
    })
  })
});

export const { useGetInstallStatusQuery, useInstallMutation } = installApi;
