import type { ReactElement } from 'react';
import NewUserForm from '../admin/NewUserForm';
import UserRankManager from '../admin/UserRankManager';
import UserRankFormPage from '../admin/UserRankFormPage';
import ForumCategoryControlPanel from '../admin/ForumCategoryControlPanel';
import ForumControlPanel from '../admin/ForumControlPanel';
import CommunityManager from '../admin/CommunityManager';
import NewsManager from '../admin/NewsManager';
import SiteSettingsPage from '../admin/SiteSettingsPage';
import StylesheetManager from '../admin/StylesheetManager';
import RatioPolicyPanel from '../admin/RatioPolicyPanel';
import RulesManager from '../admin/RulesManager';
import TicketQueuePage from '../staffInbox/TicketQueuePage';
import CannedResponsesPage from '../staffInbox/CannedResponsesPage';
import TicketView from '../staffInbox/TicketView';
import ReportsQueuePage from '../reports/ReportsQueuePage';
import ReportDetailPage from '../reports/ReportDetailPage';
import StaffPage from './StaffPage';
import StaffGroupsPage from './StaffGroupsPage';
import SiteHistoryPage from './SiteHistoryPage';
import MassPmPage from './MassPmPage';
import DonorRanksPage from './DonorRanksPage';
import RecoveryQueuePage from './RecoveryQueuePage';
import IpBansPage from './IpBansPage';
import EmailBlacklistPage from './EmailBlacklistPage';
import DonationLogPage from './DonationLogPage';
import DuplicateIpsPage from './DuplicateIpsPage';
import RegistrationLogPage from './RegistrationLogPage';
import UserWarningsPage from './UserWarningsPage';
import TagAliasesPage from './TagAliasesPage';
import GlobalNoticesPage from './GlobalNoticesPage';
import LoginWatchPage from './LoginWatchPage';
import VanityHousePage from './VanityHousePage';
import AlbumOfMonthPage from './AlbumOfMonthPage';
import UserFlowPage from './UserFlowPage';
import InvitePoolPage from './InvitePoolPage';
import InviteTreePage from './InviteTreePage';
import DncPage from './DncPage';
import CollageRecoveryPage from './CollageRecoveryPage';
import EconomicStatsPage from './EconomicStatsPage';
import ReleaseStatsPage from './ReleaseStatsPage';
import RatioWatchPage from './RatioWatchPage';
import ClientStatsPage from './ClientStatsPage';
import SiteInfoPage from './SiteInfoPage';
import GenerateTestDataPage from './GenerateTestDataPage';
import { hasAnyPermission, type Permission } from '../../utils/permissions';
import type { AuthUser } from '../../types';

export type StaffToolSection =
  | 'Administration'
  | 'User Management'
  | 'Content'
  | 'Announcements'
  | 'Community'
  | 'Managers'
  | 'Users'
  | 'Moderation'
  | 'Finances'
  | 'Site Information'
  | 'Development';

export type StaffToolDefinition = {
  id: string;
  path: string;
  label: string;
  permissions: Permission[];
  element: ReactElement;
  section?: StaffToolSection;
  showInToolbox?: boolean;
};

export const staffTools: StaffToolDefinition[] = [
  {
    id: 'staff-home',
    path: 'staff',
    label: 'Staff',
    permissions: ['staff'],
    element: <StaffPage />,
    showInToolbox: false
  },
  {
    id: 'staff-groups',
    path: 'staff/tools/staff-groups',
    label: 'Staff groups',
    permissions: ['staff_groups_manage'],
    element: <StaffGroupsPage />,
    section: 'Administration'
  },
  {
    id: 'create-user',
    path: 'staff/tools/user/new',
    label: 'Create user',
    permissions: ['users_edit'],
    element: <NewUserForm />,
    section: 'User Management'
  },
  {
    id: 'user-ranks-new',
    path: 'staff/tools/user-ranks/new',
    label: 'User ranks',
    permissions: ['rank_permissions_manage'],
    element: <UserRankFormPage />,
    showInToolbox: false
  },
  {
    id: 'user-ranks-edit',
    path: 'staff/tools/user-ranks/:id/edit',
    label: 'User ranks',
    permissions: ['rank_permissions_manage'],
    element: <UserRankFormPage />,
    showInToolbox: false
  },
  {
    id: 'user-ranks',
    path: 'staff/tools/user-ranks',
    label: 'User ranks',
    permissions: ['rank_permissions_manage'],
    element: <UserRankManager />,
    section: 'Administration'
  },
  {
    id: 'forum-categories',
    path: 'staff/tools/categories',
    label: 'Category manager',
    permissions: ['forums_manage'],
    element: <ForumCategoryControlPanel />,
    section: 'Community'
  },
  {
    id: 'forums',
    path: 'staff/tools/forums',
    label: 'Forum manager',
    permissions: ['forums_manage'],
    element: <ForumControlPanel />,
    section: 'Community'
  },
  {
    id: 'community-manager',
    path: 'staff/tools/communities',
    label: 'Community manager',
    permissions: ['communities_manage'],
    element: <CommunityManager />,
    section: 'Community'
  },
  {
    id: 'news-manager',
    path: 'staff/tools/news',
    label: 'News post',
    permissions: ['news_manage'],
    element: <NewsManager />,
    section: 'Announcements'
  },
  {
    id: 'site-settings',
    path: 'staff/tools/settings',
    label: 'Site settings',
    permissions: ['admin'],
    element: <SiteSettingsPage />,
    section: 'Administration'
  },
  {
    id: 'stylesheets',
    path: 'staff/tools/stylesheets',
    label: 'Stylesheets',
    permissions: ['admin'],
    element: <StylesheetManager />,
    section: 'Administration'
  },
  {
    id: 'ratio-policy',
    path: 'staff/tools/ratio-policy',
    label: 'Ratio policy override',
    permissions: ['ratio_policy_manage'],
    element: <RatioPolicyPanel />,
    section: 'Users'
  },
  {
    id: 'site-history',
    path: 'staff/site-history',
    label: 'Site History',
    permissions: ['site_history_manage'],
    element: <SiteHistoryPage />,
    section: 'Announcements'
  },
  {
    id: 'mass-pm',
    path: 'staff/mass-pm',
    label: 'Mass PM',
    permissions: ['messages_mass_pm'],
    element: <MassPmPage />,
    section: 'Announcements'
  },
  {
    id: 'donor-ranks',
    path: 'staff/donor-ranks',
    label: 'Donor ranks',
    permissions: ['donor_ranks_manage'],
    element: <DonorRanksPage />,
    section: 'Finances'
  },
  {
    id: 'recovery-queue',
    path: 'staff/tools/recovery-queue',
    label: 'Recovery queue',
    permissions: ['recovery_manage'],
    element: <RecoveryQueuePage />,
    section: 'User Management'
  },
  {
    id: 'ip-bans',
    path: 'staff/ip-bans',
    label: 'IP address bans',
    permissions: ['ip_bans_manage'],
    element: <IpBansPage />,
    section: 'Moderation'
  },
  {
    id: 'email-blacklist',
    path: 'staff/email-blacklist',
    label: 'Email blacklist',
    permissions: ['email_blacklist_manage'],
    element: <EmailBlacklistPage />,
    section: 'Moderation'
  },
  {
    id: 'donation-log',
    path: 'staff/donation-log',
    label: 'Donation log',
    permissions: ['donation_log_view'],
    element: <DonationLogPage />,
    section: 'Finances'
  },
  {
    id: 'duplicate-ips',
    path: 'staff/duplicate-ips',
    label: 'Duplicate IPs',
    permissions: ['duplicate_ips_view'],
    element: <DuplicateIpsPage />,
    section: 'Managers'
  },
  {
    id: 'registration-log',
    path: 'staff/registration-log',
    label: 'Registration log',
    permissions: ['registration_log_view'],
    element: <RegistrationLogPage />,
    section: 'User Management'
  },
  {
    id: 'user-warnings',
    path: 'staff/user-warnings',
    label: 'User warnings',
    permissions: ['users_warn'],
    element: <UserWarningsPage />,
    section: 'Users'
  },
  {
    id: 'tag-aliases',
    path: 'staff/tag-aliases',
    label: 'Tag aliases',
    permissions: ['tags_manage'],
    element: <TagAliasesPage />,
    section: 'Community'
  },
  {
    id: 'global-notices',
    path: 'staff/global-notices',
    label: 'Global notices',
    permissions: ['news_manage'],
    element: <GlobalNoticesPage />,
    section: 'Announcements'
  },
  {
    id: 'login-watch',
    path: 'staff/login-watch',
    label: 'Login Watch',
    permissions: ['login_watch_view'],
    element: <LoginWatchPage />,
    section: 'Administration'
  },
  {
    id: 'vanity-house',
    path: 'staff/vanity-house',
    label: 'Vanity House',
    permissions: ['news_manage'],
    element: <VanityHousePage />,
    section: 'Announcements'
  },
  {
    id: 'album-of-month',
    path: 'staff/album-of-month',
    label: 'Album of the Month',
    permissions: ['news_manage'],
    element: <AlbumOfMonthPage />,
    section: 'Announcements'
  },
  {
    id: 'user-flow',
    path: 'staff/user-flow',
    label: 'User flow',
    permissions: ['admin'],
    element: <UserFlowPage />,
    section: 'User Management'
  },
  {
    id: 'invite-pool',
    path: 'staff/invite-pool',
    label: 'Invite pool',
    permissions: ['invites_manage'],
    element: <InvitePoolPage />,
    section: 'User Management'
  },
  {
    id: 'invite-tree',
    path: 'staff/invite-tree',
    label: 'Invite tree',
    permissions: ['invites_manage'],
    element: <InviteTreePage />,
    section: 'User Management'
  },
  {
    id: 'dnc',
    path: 'staff/dnc',
    label: 'Do Not Contribute list',
    permissions: ['dnc_manage'],
    element: <DncPage />,
    section: 'Managers'
  },
  {
    id: 'collage-recovery',
    path: 'staff/collage-recovery',
    label: 'Collage recovery',
    permissions: ['collages_moderate'],
    element: <CollageRecoveryPage />,
    section: 'Managers'
  },
  {
    id: 'economic-stats',
    path: 'staff/economic-stats',
    label: 'Economic stats',
    permissions: ['admin'],
    element: <EconomicStatsPage />,
    section: 'Site Information'
  },
  {
    id: 'release-stats',
    path: 'staff/release-stats',
    label: 'Release stats',
    permissions: ['admin'],
    element: <ReleaseStatsPage />,
    section: 'Site Information'
  },
  {
    id: 'ratio-watch',
    path: 'staff/ratio-watch',
    label: 'Ratio watch',
    permissions: ['admin'],
    element: <RatioWatchPage />,
    section: 'Site Information'
  },
  {
    id: 'client-stats',
    path: 'staff/client-stats',
    label: 'OS & Browser usage',
    permissions: ['admin'],
    element: <ClientStatsPage />,
    section: 'Site Information'
  },
  {
    id: 'site-info',
    path: 'staff/site-info',
    label: 'Site info',
    permissions: ['admin'],
    element: <SiteInfoPage />,
    section: 'Development'
  },
  {
    id: 'generate-test-data',
    path: 'staff/generate-test-data',
    label: 'Generate test data',
    permissions: ['admin'],
    element: <GenerateTestDataPage />,
    section: 'Development'
  },
  {
    id: 'ticket-queue',
    path: 'staff/tickets',
    label: 'Ticket queue',
    permissions: ['staff_inbox_manage'],
    element: <TicketQueuePage />,
    section: 'Managers'
  },
  {
    id: 'ticket-detail',
    path: 'staff/tickets/:id',
    label: 'Ticket queue',
    permissions: ['staff_inbox_manage'],
    element: <TicketView />,
    showInToolbox: false
  },
  {
    id: 'canned-responses',
    path: 'staff/inbox/responses',
    label: 'Canned responses',
    permissions: ['staff_inbox_manage'],
    element: <CannedResponsesPage />,
    section: 'Managers'
  },
  {
    id: 'reports-queue',
    path: 'staff/reports',
    label: 'Reports queue',
    permissions: ['reports_manage'],
    element: <ReportsQueuePage />,
    section: 'Managers'
  },
  {
    id: 'report-detail',
    path: 'staff/reports/:id',
    label: 'Reports queue',
    permissions: ['reports_manage'],
    element: <ReportDetailPage />,
    showInToolbox: false
  },
  {
    id: 'rules-manager',
    path: 'staff/tools/rules',
    label: 'Rules manager',
    permissions: ['rules_manage'],
    element: <RulesManager />,
    section: 'Content'
  }
];

export const staffToolSections: StaffToolSection[] = [
  'Administration',
  'User Management',
  'Content',
  'Announcements',
  'Community',
  'Managers',
  'Users',
  'Moderation',
  'Finances',
  'Site Information',
  'Development'
];

export const toolboxStaffTools = staffTools.filter(
  (tool) => tool.showInToolbox !== false && tool.section
);

export const getStaffTool = (id: string) =>
  staffTools.find((tool) => tool.id === id);

export const canAccessToolbox = (user: AuthUser | null | undefined): boolean =>
  toolboxStaffTools.some((tool) => hasAnyPermission(user, tool.permissions));
