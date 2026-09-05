import { api } from '../api';
import type { paths } from '../../types/api';

export type IpBan =
  paths['/ip-bans']['get']['responses'][200]['content']['application/json'][number];

export type EmailBlacklistEntry =
  paths['/email-blacklist']['get']['responses'][200]['content']['application/json'][number];

export type Donation =
  paths['/donations']['get']['responses'][200]['content']['application/json']['data'][number];

// Every admin result type below is read off the generated contract. The
// `paths[...]` expressions are spelled out rather than wrapped in a local
// generic helper: the service-types guard looks for a literal `paths[` read, so
// a helper would satisfy the type checker while reading as hand-written to the
// gate — outsmarting the guard rather than meeting it.
export type DuplicateIpGroup =
  paths['/users/duplicate-ips']['get']['responses'][200]['content']['application/json'][number];
export type DuplicateIpUser = DuplicateIpGroup['users'][number];

export type RegistrationLogUser =
  paths['/users/registration-log']['get']['responses'][200]['content']['application/json']['data'][number];

export type SessionItem =
  paths['/users/sessions']['get']['responses'][200]['content']['application/json']['data'][number];
export type UserRef = SessionItem['user'];

export type InviteItem =
  paths['/users/invites']['get']['responses'][200]['content']['application/json']['data'][number];
export type InviteTreeItem =
  paths['/users/invite-tree']['get']['responses'][200]['content']['application/json']['data'][number];
export type RatioWatchItem =
  paths['/users/ratio-watch']['get']['responses'][200]['content']['application/json']['data'][number];
export type VanityHouseArtist =
  paths['/artists/vanity-house']['get']['responses'][200]['content']['application/json']['data'][number];

export type FeaturedAlbumItem =
  paths['/announcements/album-of-month']['get']['responses'][200]['content']['application/json'][number];

export type DeletedCollageItem =
  paths['/collages/deleted']['get']['responses'][200]['content']['application/json']['data'][number];

export type EconomyStatsResponse =
  paths['/stats/economy']['get']['responses'][200]['content']['application/json'];

// Kept as NAMES because components type their props with them — but each is now
// a slice of the generated client rather than a second description (#293).
export type EconomyGroupedItem = EconomyStatsResponse['grouped'][number];
export type EconomyTransactionItem = EconomyStatsResponse['recent'][number];

export type ReleaseStatsItem =
  paths['/stats/releases']['get']['responses'][200]['content']['application/json'];
export type ClientStatsItem =
  paths['/stats/clients']['get']['responses'][200]['content']['application/json'][number];
export type UserFlowData =
  paths['/stats/user-flow']['get']['responses'][200]['content']['application/json'];
export type SiteInfoData =
  paths['/stats/site-info']['get']['responses'][200]['content']['application/json'];

export type DncEntry =
  paths['/communities/{communityId}/dnc']['get']['responses'][200]['content']['application/json'][number];

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
      paths['/donations']['get']['responses'][200]['content']['application/json'],
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
      paths['/users/registration-log']['get']['responses'][200]['content']['application/json'],
      number | void
    >({
      query: (page = 1) => `/users/registration-log?page=${page}`
    }),

    // Login Watch
    getSessions: build.query<
      paths['/users/sessions']['get']['responses'][200]['content']['application/json'],
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
      paths['/users/invites']['get']['responses'][200]['content']['application/json'],
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
      paths['/users/invite-tree']['get']['responses'][200]['content']['application/json'],
      number | void
    >({
      query: (page = 1) => `/users/invite-tree?page=${page}`,
      providesTags: ['InviteTree']
    }),

    // Ratio Watch
    getRatioWatch: build.query<
      paths['/users/ratio-watch']['get']['responses'][200]['content']['application/json'],
      number | void
    >({
      query: (page = 1) => `/users/ratio-watch?page=${page}`,
      providesTags: ['RatioWatch']
    }),

    // Vanity House
    getVanityHouseArtists: build.query<
      paths['/artists/vanity-house']['get']['responses'][200]['content']['application/json'],
      number | void
    >({
      query: (page = 1) => `/artists/vanity-house?page=${page}`,
      providesTags: ['VanityHouse']
    }),
    setVanityHouse: build.mutation<
      paths['/artists/{id}/vanity-house']['put']['responses'][200]['content']['application/json'],
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
        image?: string;
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
      paths['/collages/deleted']['get']['responses'][200]['content']['application/json'],
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
    getEconomyStats: build.query<EconomyStatsResponse, void>({
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
