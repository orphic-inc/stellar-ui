import type { ComponentType, ReactNode } from 'react';
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
import TicketView from '../../../staffInbox/TicketView';
import ReportForm from '../../../reports/ReportForm';
import ReportDetailPage from '../../../reports/ReportDetailPage';
import MyReportsPage from '../../../reports/MyReportsPage';
import Toolbox from '../../../admin/Toolbox';
import RulesPage from '../../../rules/RulesPage';
import RulesSubPage from '../../../rules/RulesSubPage';
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
import SnatchList from '../snatch/SnatchList';
import BookmarksPage from '../bookmarks/BookmarksPage';
import FriendsPage from '../friends/FriendsPage';
import DonatePage from '../../../donate/DonatePage';
import WikiListPage from '../../../wiki/WikiListPage';
import WikiViewPage from '../../../wiki/WikiViewPage';
import WikiEditPage from '../../../wiki/WikiEditPage';
import WikiHistoryPage from '../../../wiki/WikiHistoryPage';
import { useGetMeQuery } from '../../../../store/services/authApi';
import StaffGate from '../../../staff/StaffGate';
import { canSeeTop10History } from '../../../staff/staffAffordances';
import { canAccessToolbox, staffTools } from '../../../staff/staffToolRegistry';

const wrap = (Component: ComponentType) => (
  <ErrorBoundary FallbackComponent={FallbackComponent}>
    <Component />
  </ErrorBoundary>
);

const StaffToolboxGate = ({ children }: { children: ReactNode }) => {
  const { data: user } = useGetMeQuery();

  if (!user || !canAccessToolbox(user)) {
    return <Navigate to="/private" replace />;
  }

  return <>{children}</>;
};

const StaffTop10HistoryGate = ({ children }: { children: ReactNode }) => {
  const { data: user } = useGetMeQuery();

  if (!user || !canSeeTop10History(user)) {
    return <Navigate to="/private/top10/releases" replace />;
  }

  return <>{children}</>;
};

const PrivateContent = () => (
  <Routes>
    <Route path="user/edit/:id" element={wrap(Settings)} />
    <Route path="user/snatch-list" element={wrap(SnatchList)} />
    <Route path="user/invite-tree" element={<InviteTree />} />
    <Route path="user/:id/invite-tree" element={<InviteTree />} />
    <Route path="user/:id" element={wrap(UserProfile)} />
    <Route path="invite" element={<InviteForm />} />
    <Route path="donate" element={wrap(DonatePage)} />
    <Route path="ratio" element={wrap(RatioRulesPage)} />
    <Route path="bookmarks" element={wrap(BookmarksPage)} />
    <Route path="friends" element={wrap(FriendsPage)} />

    <Route
      path="staff/tools"
      element={
        <StaffToolboxGate>
          <Toolbox />
        </StaffToolboxGate>
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

    <Route path="reports/new" element={wrap(ReportForm)} />
    <Route path="reports/mine" element={wrap(MyReportsPage)} />
    <Route path="reports/:id" element={wrap(ReportDetailPage)} />

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
          <StaffTop10HistoryGate>
            <TopHistoryPage />
          </StaffTop10HistoryGate>
        }
      />
    </Route>

    <Route path="stats/history" element={wrap(SiteStatsHistoryPage)} />
    <Route path="user/:id/stats" element={wrap(UserStatsHistoryPage)} />

    {staffTools
      .filter((tool) => tool.path !== 'staff/tools')
      .map((tool) => (
        <Route
          key={tool.id}
          path={tool.path}
          element={
            <StaffGate permissions={tool.permissions}>{tool.element}</StaffGate>
          }
        />
      ))}

    <Route path="" element={<PrivateHomepage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default PrivateContent;
