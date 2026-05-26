import type { ReactElement } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import ErrorBoundary from '../../../layout/ErrorBoundary';
import FallbackComponent from '../../../layout/FallbackComponent';
import NotFound from '../../../layout/NotFound';

import PrivateHomepage from '../PrivateHomepage';
import UserProfile from '../../../profile/UserProfile';
import Settings from '../../../profile/settings/Settings';
import RatioRulesPage from '../../../profile/RatioRulesPage';
import InviteForm from '../../../profile/invite/InviteForm';
import InviteTree from '../../../profile/invite/InviteTree';

import ForumCategoryPage from '../../../forum/ForumCategoryPage';
import ForumPage from '../../../forum/ForumPage';
import ForumTopicPage from '../../../forum/ForumTopicPage';
import NewTopicForm from '../../../forum/NewTopicForm';

import CommunitiesPage from '../../../communities/CommunitiesPage';
import CommunityPage from '../../../communities/CommunityPage';
import ReleasePage from '../../../communities/ReleasePage';
import AddContributionForm from '../../../communities/AddContributionForm';
import ArtistPage from '../../../communities/ArtistPage';
import ContributeForm from '../../../contribute/ContributeForm';
import ContributionsPage from '../../../contribute/ContributionsPage';

import RequestsPage from '../../../requests/RequestsPage';
import RequestDetailPage from '../../../requests/RequestDetailPage';
import CreateRequestForm from '../../../requests/CreateRequestForm';
import CollageBrowse from '../../../collages/CollageBrowse';
import CollageCreate from '../../../collages/CollageCreate';
import CollageDetail from '../../../collages/CollageDetail';
import CollageEdit from '../../../collages/CollageEdit';
import InboxPage from '../../../messages/InboxPage';
import SentboxPage from '../../../messages/SentboxPage';
import ComposeForm from '../../../messages/ComposeForm';
import ConversationView from '../../../messages/ConversationView';
import MyTicketsPage from '../../../staffInbox/MyTicketsPage';
import NewTicketForm from '../../../staffInbox/NewTicketForm';
import CannedResponsesPage from '../../../staffInbox/CannedResponsesPage';
import TicketView from '../../../staffInbox/TicketView';
import ReportsQueuePage from '../../../reports/ReportsQueuePage';
import ReportDetailPage from '../../../reports/ReportDetailPage';
import MyReportsPage from '../../../reports/MyReportsPage';
import ReportForm from '../../../reports/ReportForm';
import Toolbox from '../../../admin/Toolbox';
import NewUserForm from '../../../admin/NewUserForm';
import UserRankManager from '../../../admin/UserRankManager';
import UserRankFormPage from '../../../admin/UserRankFormPage';
import ForumCategoryControlPanel from '../../../admin/ForumCategoryControlPanel';
import ForumControlPanel from '../../../admin/ForumControlPanel';
import CommunityManager from '../../../admin/CommunityManager';
import NewsManager from '../../../admin/NewsManager';
import SiteSettingsPage from '../../../admin/SiteSettingsPage';
import RatioPolicyPanel from '../../../admin/RatioPolicyPanel';
import TicketQueuePage from '../../../staffInbox/TicketQueuePage';
import StaffPage from '../../../staff/StaffPage';
import StaffGroupsPage from '../../../staff/StaffGroupsPage';
import SiteHistoryPage from '../../../staff/SiteHistoryPage';
import MassPmPage from '../../../staff/MassPmPage';
import DonorRanksPage from '../../../staff/DonorRanksPage';
import RecoveryQueuePage from '../../../staff/RecoveryQueuePage';
import IpBansPage from '../../../staff/IpBansPage';
import EmailBlacklistPage from '../../../staff/EmailBlacklistPage';
import DonationLogPage from '../../../staff/DonationLogPage';
import DuplicateIpsPage from '../../../staff/DuplicateIpsPage';
import RegistrationLogPage from '../../../staff/RegistrationLogPage';
import UserWarningsPage from '../../../staff/UserWarningsPage';
import TagAliasesPage from '../../../staff/TagAliasesPage';
import GlobalNoticesPage from '../../../staff/GlobalNoticesPage';
import LoginWatchPage from '../../../staff/LoginWatchPage';
import VanityHousePage from '../../../staff/VanityHousePage';
import AlbumOfMonthPage from '../../../staff/AlbumOfMonthPage';
import UserFlowPage from '../../../staff/UserFlowPage';
import InvitePoolPage from '../../../staff/InvitePoolPage';
import InviteTreePage from '../../../staff/InviteTreePage';
import DncPage from '../../../staff/DncPage';
import CollageRecoveryPage from '../../../staff/CollageRecoveryPage';
import EconomicStatsPage from '../../../staff/EconomicStatsPage';
import ReleaseStatsPage from '../../../staff/ReleaseStatsPage';
import RatioWatchPage from '../../../staff/RatioWatchPage';
import ClientStatsPage from '../../../staff/ClientStatsPage';
import SiteInfoPage from '../../../staff/SiteInfoPage';
import SnatchList from '../snatch/SnatchList';
import BookmarksPage from '../bookmarks/BookmarksPage';
import FriendsPage from '../friends/FriendsPage';
import DonatePage from '../../../donate/DonatePage';
import WikiListPage from '../../../wiki/WikiListPage';
import WikiViewPage from '../../../wiki/WikiViewPage';
import WikiEditPage from '../../../wiki/WikiEditPage';
import WikiHistoryPage from '../../../wiki/WikiHistoryPage';
import RulesPage from '../../../rules/RulesPage';
import RulesSubPage from '../../../rules/RulesSubPage';
import RulesManager from '../../../admin/RulesManager';
import ReleaseBrowsePage from '../../../releases/ReleaseBrowsePage';
import ArtistBrowsePage from '../../../artists/ArtistBrowsePage';
import LogBrowsePage from '../../../log/LogBrowsePage';
import UserBrowsePage from '../../../users/UserBrowsePage';
import Top10Layout from '../../../top10/Top10Layout';
import TopReleasesPage from '../../../top10/TopReleasesPage';
import TopUsersPage from '../../../top10/TopUsersPage';
import TopTagsPage from '../../../top10/TopTagsPage';
import TopVotesPage from '../../../top10/TopVotesPage';
import TopHistoryPage from '../../../top10/TopHistoryPage';
import SiteStatsHistoryPage from '../stats/SiteStatsHistoryPage';
import UserStatsHistoryPage from '../stats/UserStatsHistoryPage';
import DraftsPage from '../../../messages/DraftsPage';
import { useGetMeQuery } from '../../../../store/services/authApi';
import {
  hasAnyPermission,
  type Permission
} from '../../../../utils/permissions';

const wrap = (Component: React.ComponentType) => (
  <ErrorBoundary FallbackComponent={FallbackComponent}>
    <Component />
  </ErrorBoundary>
);

const StaffGate = ({
  permissions,
  children
}: {
  permissions: Permission[];
  children: ReactElement;
}) => {
  const { data: user } = useGetMeQuery();

  if (!user || !hasAnyPermission(user, permissions)) {
    return <Navigate to="/private" replace />;
  }

  return children;
};

const PrivateContent = () => (
  <Routes>
    <Route path="user/edit/:id" element={wrap(Settings)} />
    <Route path="user/snatch-list" element={wrap(SnatchList)} />
    <Route path="user/invite-tree" element={<InviteTree />} />
    <Route path="user/:id" element={wrap(UserProfile)} />
    <Route path="invite" element={<InviteForm />} />
    <Route path="donate" element={wrap(DonatePage)} />
    <Route path="ratio" element={wrap(RatioRulesPage)} />
    <Route path="bookmarks" element={wrap(BookmarksPage)} />
    <Route path="friends" element={wrap(FriendsPage)} />

    <Route path="staff" element={wrap(StaffPage)} />
    <Route
      path="staff/tools/staff-groups"
      element={
        <StaffGate permissions={['staff_groups_manage']}>
          <StaffGroupsPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/user/new"
      element={
        <StaffGate permissions={['users_edit']}>
          <NewUserForm />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/user-ranks/new"
      element={
        <StaffGate permissions={['rank_permissions_manage']}>
          <UserRankFormPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/user-ranks/:id/edit"
      element={
        <StaffGate permissions={['rank_permissions_manage']}>
          <UserRankFormPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/user-ranks"
      element={
        <StaffGate permissions={['rank_permissions_manage']}>
          <UserRankManager />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/categories"
      element={
        <StaffGate permissions={['forums_manage']}>
          <ForumCategoryControlPanel />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/forums"
      element={
        <StaffGate permissions={['forums_manage']}>
          <ForumControlPanel />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/communities"
      element={
        <StaffGate permissions={['communities_manage']}>
          <CommunityManager />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/news"
      element={
        <StaffGate permissions={['news_manage']}>
          <NewsManager />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/settings"
      element={
        <StaffGate permissions={['admin']}>
          <SiteSettingsPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/ratio-policy"
      element={
        <StaffGate permissions={['ratio_policy_manage']}>
          <RatioPolicyPanel />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools"
      element={
        <StaffGate
          permissions={[
            'rank_permissions_manage',
            'staff_groups_manage',
            'forums_manage',
            'forums_moderate',
            'communities_manage',
            'contributions_manage',
            'dnc_manage',
            'collages_moderate',
            'news_manage',
            'rules_manage',
            'reports_manage',
            'staff_inbox_manage',
            'users_edit',
            'users_warn',
            'recovery_manage',
            'invites_manage',
            'ratio_policy_manage',
            'site_history_manage',
            'ip_bans_manage',
            'email_blacklist_manage',
            'donor_ranks_manage',
            'donation_log_view',
            'login_watch_view',
            'duplicate_ips_view',
            'registration_log_view',
            'tags_manage'
          ]}
        >
          <Toolbox />
        </StaffGate>
      }
    />
    <Route
      path="staff/site-history"
      element={
        <StaffGate permissions={['site_history_manage']}>
          <SiteHistoryPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/mass-pm"
      element={
        <StaffGate permissions={['messages_mass_pm']}>
          <MassPmPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/donor-ranks"
      element={
        <StaffGate permissions={['donor_ranks_manage']}>
          <DonorRanksPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/recovery-queue"
      element={
        <StaffGate permissions={['recovery_manage']}>
          <RecoveryQueuePage />
        </StaffGate>
      }
    />
    <Route
      path="staff/ip-bans"
      element={
        <StaffGate permissions={['ip_bans_manage']}>
          <IpBansPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/email-blacklist"
      element={
        <StaffGate permissions={['email_blacklist_manage']}>
          <EmailBlacklistPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/donation-log"
      element={
        <StaffGate permissions={['donation_log_view']}>
          <DonationLogPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/duplicate-ips"
      element={
        <StaffGate permissions={['duplicate_ips_view']}>
          <DuplicateIpsPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/registration-log"
      element={
        <StaffGate permissions={['registration_log_view']}>
          <RegistrationLogPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/user-warnings"
      element={
        <StaffGate permissions={['users_warn']}>
          <UserWarningsPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tag-aliases"
      element={
        <StaffGate permissions={['tags_manage']}>
          <TagAliasesPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/global-notices"
      element={
        <StaffGate permissions={['news_manage']}>
          <GlobalNoticesPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/login-watch"
      element={
        <StaffGate permissions={['login_watch_view']}>
          <LoginWatchPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/vanity-house"
      element={
        <StaffGate permissions={['news_manage']}>
          <VanityHousePage />
        </StaffGate>
      }
    />
    <Route
      path="staff/album-of-month"
      element={
        <StaffGate permissions={['news_manage']}>
          <AlbumOfMonthPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/user-flow"
      element={
        <StaffGate permissions={['admin']}>
          <UserFlowPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/invite-pool"
      element={
        <StaffGate permissions={['invites_manage']}>
          <InvitePoolPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/invite-tree"
      element={
        <StaffGate permissions={['invites_manage']}>
          <InviteTreePage />
        </StaffGate>
      }
    />
    <Route
      path="staff/dnc"
      element={
        <StaffGate permissions={['dnc_manage']}>
          <DncPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/collage-recovery"
      element={
        <StaffGate permissions={['collages_moderate']}>
          <CollageRecoveryPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/economic-stats"
      element={
        <StaffGate permissions={['admin']}>
          <EconomicStatsPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/release-stats"
      element={
        <StaffGate permissions={['admin']}>
          <ReleaseStatsPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/ratio-watch"
      element={
        <StaffGate permissions={['admin']}>
          <RatioWatchPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/client-stats"
      element={
        <StaffGate permissions={['admin']}>
          <ClientStatsPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/site-info"
      element={
        <StaffGate permissions={['admin']}>
          <SiteInfoPage />
        </StaffGate>
      }
    />

    <Route
      path="forums/:forumId/topics/:forumTopicId"
      element={wrap(ForumTopicPage)}
    />
    <Route path="forums/:forumId/new" element={<NewTopicForm />} />
    <Route path="forums/:forumId" element={wrap(ForumPage)} />
    <Route path="forums" element={wrap(ForumCategoryPage)} />

    <Route
      path="communities/:communityId/releases/:releaseId/contribute"
      element={wrap(AddContributionForm)}
    />
    <Route
      path="communities/:communityId/releases/:releaseId"
      element={wrap(ReleasePage)}
    />
    <Route path="communities/:communityId" element={wrap(CommunityPage)} />
    <Route path="communities" element={wrap(CommunitiesPage)} />
    <Route path="artists/:id" element={wrap(ArtistPage)} />
    <Route path="contribute/list" element={wrap(ContributionsPage)} />
    <Route path="contribute" element={wrap(ContributeForm)} />

    <Route
      path="requests/new"
      element={
        <StaffGate permissions={['requests_create']}>
          <CreateRequestForm />
        </StaffGate>
      }
    />
    <Route path="requests/:id" element={wrap(RequestDetailPage)} />
    <Route path="requests" element={wrap(RequestsPage)} />

    <Route
      path="collages/new"
      element={
        <StaffGate permissions={['collages_create']}>
          <CollageCreate />
        </StaffGate>
      }
    />
    <Route path="collages/:id/edit" element={wrap(CollageEdit)} />
    <Route path="collages/:id" element={wrap(CollageDetail)} />
    <Route path="collages" element={wrap(CollageBrowse)} />

    <Route path="messages/tickets/new" element={wrap(NewTicketForm)} />
    <Route path="messages/tickets/:id" element={wrap(TicketView)} />
    <Route path="messages/tickets" element={wrap(MyTicketsPage)} />
    <Route path="messages/drafts" element={wrap(DraftsPage)} />
    <Route path="messages/new" element={wrap(ComposeForm)} />
    <Route path="messages/sent" element={wrap(SentboxPage)} />
    <Route path="messages/:id" element={wrap(ConversationView)} />
    <Route path="messages" element={wrap(InboxPage)} />

    <Route
      path="staff/tickets/:id"
      element={
        <StaffGate permissions={['staff_inbox_manage']}>
          <TicketView />
        </StaffGate>
      }
    />
    <Route
      path="staff/tickets"
      element={
        <StaffGate permissions={['staff_inbox_manage']}>
          <TicketQueuePage />
        </StaffGate>
      }
    />
    <Route
      path="staff/inbox/responses"
      element={
        <StaffGate permissions={['staff_inbox_manage']}>
          <CannedResponsesPage />
        </StaffGate>
      }
    />

    <Route
      path="staff/reports"
      element={
        <StaffGate permissions={['reports_manage']}>
          <ReportsQueuePage />
        </StaffGate>
      }
    />
    <Route
      path="staff/reports/:id"
      element={
        <StaffGate permissions={['reports_manage']}>
          <ReportDetailPage />
        </StaffGate>
      }
    />

    <Route path="reports/new" element={wrap(ReportForm)} />
    <Route path="reports/mine" element={wrap(MyReportsPage)} />
    <Route path="reports/:id" element={wrap(ReportDetailPage)} />

    <Route
      path="staff/tools/rules"
      element={
        <StaffGate permissions={['rules_manage']}>
          <RulesManager />
        </StaffGate>
      }
    />

    <Route path="rules/:slug" element={wrap(RulesSubPage)} />
    <Route path="rules" element={wrap(RulesPage)} />

    <Route path="wiki/new" element={wrap(WikiEditPage)} />
    <Route path="wiki/:id/edit" element={wrap(WikiEditPage)} />
    <Route path="wiki/:id/history" element={wrap(WikiHistoryPage)} />
    <Route path="wiki/:id" element={wrap(WikiViewPage)} />
    <Route path="wiki" element={wrap(WikiListPage)} />

    <Route path="releases" element={wrap(ReleaseBrowsePage)} />
    <Route path="artists" element={wrap(ArtistBrowsePage)} />
    <Route path="log" element={wrap(LogBrowsePage)} />
    <Route path="users" element={wrap(UserBrowsePage)} />

    <Route path="top10" element={wrap(Top10Layout)}>
      <Route path="releases" element={<TopReleasesPage />} />
      <Route path="users" element={<TopUsersPage />} />
      <Route path="tags" element={<TopTagsPage />} />
      <Route path="votes" element={<TopVotesPage />} />
      <Route
        path="history"
        element={
          <StaffGate permissions={['staff', 'admin']}>
            <TopHistoryPage />
          </StaffGate>
        }
      />
    </Route>

    <Route path="stats/history" element={wrap(SiteStatsHistoryPage)} />
    <Route path="users/:id/stats" element={wrap(UserStatsHistoryPage)} />

    <Route path="" element={<PrivateHomepage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default PrivateContent;
