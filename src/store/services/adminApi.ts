import { api } from '../api';

export interface IpBan {
  id: number;
  fromIp: string;
  toIp: string;
}

export interface EmailBlacklistEntry {
  id: number;
  userId: number;
  email: string;
  comment: string;
  addedAt: string;
}

export interface Donation {
  id: number;
  userId: number;
  user: { id: number; username: string } | null;
  amount: number;
  email: string;
  donatedAt: string;
  currency: string;
  source: string;
  reason: string;
}

export interface DuplicateIpUser {
  id: number;
  username: string;
  dateRegistered: string;
  disabled: boolean;
  lastLogin: string | null;
}

export interface DuplicateIpGroup {
  ip: string;
  count: number;
  users: DuplicateIpUser[];
}

export interface RegistrationLogUser {
  id: number;
  username: string;
  email: string | null;
  dateRegistered: string;
  disabled: boolean;
  lastIp: string | null;
  userRank: { id: number; name: string } | null;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    // IP Bans
    getIpBans: build.query<IpBan[], void>({
      query: () => '/ip-bans',
      providesTags: ['IpBan']
    }),
    createIpBan: build.mutation<IpBan, { fromIp: string; toIp?: string }>({
      query: (data) => ({ url: '/ip-bans', method: 'POST', body: data }),
      invalidatesTags: ['IpBan']
    }),
    deleteIpBan: build.mutation<void, number>({
      query: (id) => ({ url: `/ip-bans/${id}`, method: 'DELETE' }),
      invalidatesTags: ['IpBan']
    }),

    // Email Blacklist
    getEmailBlacklist: build.query<EmailBlacklistEntry[], void>({
      query: () => '/email-blacklist',
      providesTags: ['EmailBlacklist']
    }),
    createEmailBlacklistEntry: build.mutation<
      EmailBlacklistEntry,
      { email: string; comment: string }
    >({
      query: (data) => ({
        url: '/email-blacklist',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['EmailBlacklist']
    }),
    deleteEmailBlacklistEntry: build.mutation<void, number>({
      query: (id) => ({ url: `/email-blacklist/${id}`, method: 'DELETE' }),
      invalidatesTags: ['EmailBlacklist']
    }),

    // Donations
    getDonations: build.query<
      PaginatedResponse<Donation>,
      { page?: number; userId?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.page) params.set('page', String(args.page));
        if (args?.userId) params.set('userId', String(args.userId));
        return `/donations?${params.toString()}`;
      },
      providesTags: ['Donation']
    }),
    createDonation: build.mutation<
      Donation,
      {
        userId: number;
        amount: number;
        email: string;
        donatedAt: string;
        currency?: string;
        source?: string;
        reason: string;
      }
    >({
      query: (data) => ({ url: '/donations', method: 'POST', body: data }),
      invalidatesTags: ['Donation']
    }),
    deleteDonation: build.mutation<void, number>({
      query: (id) => ({ url: `/donations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Donation']
    }),

    // Duplicate IPs (read-only)
    getDuplicateIps: build.query<DuplicateIpGroup[], void>({
      query: () => '/users/duplicate-ips'
    }),

    // Registration Log (read-only, paginated)
    getRegistrationLog: build.query<
      PaginatedResponse<RegistrationLogUser>,
      number | void
    >({
      query: (page = 1) => `/users/registration-log?page=${page}`
    })
  })
});

export const {
  useGetIpBansQuery,
  useCreateIpBanMutation,
  useDeleteIpBanMutation,
  useGetEmailBlacklistQuery,
  useCreateEmailBlacklistEntryMutation,
  useDeleteEmailBlacklistEntryMutation,
  useGetDonationsQuery,
  useCreateDonationMutation,
  useDeleteDonationMutation,
  useGetDuplicateIpsQuery,
  useGetRegistrationLogQuery
} = adminApi;
