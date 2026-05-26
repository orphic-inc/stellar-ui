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

export interface UserRef {
  id: number;
  username: string;
}

export interface SessionItem {
  id: string;
  user: UserRef;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  revokedAt: string | null;
}

export interface InviteItem {
  id: number;
  inviter: UserRef;
  email: string;
  expires: string;
  reason: string;
  status: string;
}

export interface InviteTreeItem {
  id: number;
  userId: number;
  user: UserRef;
  inviterId: number;
  inviter: UserRef | null;
  treeId: number;
  treeLevel: number;
  treePosition: number;
}

export interface RatioWatchItem {
  userId: number;
  user: UserRef;
  status: string;
  watchStartedAt: string | null;
  watchExpiresAt: string | null;
  leechDisabledAt: string | null;
  lastEvaluatedAt: string;
}

export interface VanityHouseArtist {
  id: number;
  name: string;
  vanityHouse: boolean;
  _count: { releases: number };
}

export interface FeaturedAlbumItem {
  id: number;
  groupId: number;
  threadId: number;
  title: string;
  started: string;
  ended: string;
}

export interface DeletedCollageItem {
  id: number;
  name: string;
  user: UserRef;
  deletedAt: string | null;
  createdAt: string;
}

export interface EconomyGroupedItem {
  reason: string;
  _sum: { amount: string | null };
  _count: number;
}

export interface EconomyTransactionItem {
  id: number;
  user: UserRef;
  amount: string;
  reason: string;
  createdAt: string;
}

export interface ReleaseStatsItem {
  releases: number;
  contributions: number;
  artists: number;
  byType: { type: string; _count: number }[];
  byLinkStatus: { linkStatus: string; _count: number }[];
}

export interface ClientStatsItem {
  userAgent: string | null;
  count: number;
}

export interface UserFlowData {
  inviteFunnel: { status: string; _count: number }[];
  snapshots: {
    bucketAt: string;
    totalUsers: number;
    activeThisMonth: number;
  }[];
}

export interface SiteInfoData {
  totalUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  releases: number;
  artists: number;
  contributions: number;
  communities: number;
  forumTopics: number;
  forumPosts: number;
  collages: number;
  wikiPages: number;
}

export interface DncEntry {
  id: number;
  name: string;
  comment: string;
  communityId: number;
  userId: number;
  createdAt: string;
  addedBy: UserRef | null;
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
    }),

    // Login Watch
    getSessions: build.query<
      PaginatedResponse<SessionItem>,
      { page?: number; userId?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.page) params.set('page', String(args.page));
        if (args?.userId) params.set('userId', String(args.userId));
        return `/users/sessions?${params.toString()}`;
      },
      providesTags: ['Session']
    }),

    // Invite Pool
    getInvites: build.query<
      PaginatedResponse<InviteItem>,
      { page?: number; status?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.page) params.set('page', String(args.page));
        if (args?.status) params.set('status', args.status);
        return `/users/invites?${params.toString()}`;
      },
      providesTags: ['Invite']
    }),

    // Invite Tree
    getInviteTree: build.query<
      PaginatedResponse<InviteTreeItem>,
      number | void
    >({
      query: (page = 1) => `/users/invite-tree?page=${page}`,
      providesTags: ['InviteTree']
    }),

    // Ratio Watch
    getRatioWatch: build.query<
      PaginatedResponse<RatioWatchItem>,
      number | void
    >({
      query: (page = 1) => `/users/ratio-watch?page=${page}`,
      providesTags: ['RatioWatch']
    }),

    // Vanity House
    getVanityHouseArtists: build.query<
      PaginatedResponse<VanityHouseArtist>,
      number | void
    >({
      query: (page = 1) => `/artists/vanity-house?page=${page}`,
      providesTags: ['VanityHouse']
    }),
    setVanityHouse: build.mutation<
      VanityHouseArtist,
      { id: number; vanityHouse: boolean }
    >({
      query: ({ id, vanityHouse }) => ({
        url: `/artists/${id}/vanity-house`,
        method: 'PUT',
        body: { vanityHouse }
      }),
      invalidatesTags: ['VanityHouse']
    }),

    // Album of the Month
    getAlbumOfMonth: build.query<FeaturedAlbumItem[], void>({
      query: () => '/announcements/album-of-month',
      providesTags: ['AlbumOfMonth']
    }),
    createAlbumOfMonth: build.mutation<
      FeaturedAlbumItem,
      {
        groupId: number;
        threadId: number;
        title: string;
        started: string;
        ended: string;
      }
    >({
      query: (body) => ({
        url: '/announcements/album-of-month',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AlbumOfMonth']
    }),
    deleteAlbumOfMonth: build.mutation<void, number>({
      query: (albumId) => ({
        url: `/announcements/album-of-month/${albumId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['AlbumOfMonth']
    }),

    // Deleted Collages
    getDeletedCollages: build.query<
      PaginatedResponse<DeletedCollageItem>,
      number | void
    >({
      query: (page = 1) => `/collages/deleted?page=${page}`,
      providesTags: ['DeletedCollage']
    }),

    // DNC
    getDnc: build.query<DncEntry[], number>({
      query: (communityId) => `/communities/${communityId}/dnc`,
      providesTags: ['Dnc']
    }),
    createDncEntry: build.mutation<
      DncEntry,
      { communityId: number; name: string; comment: string }
    >({
      query: ({ communityId, ...body }) => ({
        url: `/communities/${communityId}/dnc`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Dnc']
    }),
    deleteDncEntry: build.mutation<
      void,
      { communityId: number; dncId: number }
    >({
      query: ({ communityId, dncId }) => ({
        url: `/communities/${communityId}/dnc/${dncId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Dnc']
    }),

    // Stats
    getEconomyStats: build.query<
      { grouped: EconomyGroupedItem[]; recent: EconomyTransactionItem[] },
      void
    >({
      query: () => '/stats/economy',
      providesTags: ['EconomyStats']
    }),
    getReleaseStats: build.query<ReleaseStatsItem, void>({
      query: () => '/stats/releases',
      providesTags: ['ReleaseStats']
    }),
    getClientStats: build.query<ClientStatsItem[], void>({
      query: () => '/stats/clients',
      providesTags: ['ClientStats']
    }),
    getUserFlow: build.query<UserFlowData, void>({
      query: () => '/stats/user-flow',
      providesTags: ['UserFlow']
    }),
    getSiteInfo: build.query<SiteInfoData, void>({
      query: () => '/stats/site-info',
      providesTags: ['SiteInfo']
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
  useGetRegistrationLogQuery,
  useGetSessionsQuery,
  useGetInvitesQuery,
  useGetInviteTreeQuery,
  useGetRatioWatchQuery,
  useGetVanityHouseArtistsQuery,
  useSetVanityHouseMutation,
  useGetAlbumOfMonthQuery,
  useCreateAlbumOfMonthMutation,
  useDeleteAlbumOfMonthMutation,
  useGetDeletedCollagesQuery,
  useGetDncQuery,
  useCreateDncEntryMutation,
  useDeleteDncEntryMutation,
  useGetEconomyStatsQuery,
  useGetReleaseStatsQuery,
  useGetClientStatsQuery,
  useGetUserFlowQuery,
  useGetSiteInfoQuery
} = adminApi;
