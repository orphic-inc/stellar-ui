import type { ReactElement } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorBoundary from '../../../layout/ErrorBoundary';
import FallbackComponent from '../../../layout/FallbackComponent';
import NotFound from '../../../layout/NotFound';

import PrivateHomepage from '../PrivateHomepage';
import UserProfile from '../../../profile/UserProfile';
import Settings from '../../../profile/settings/Settings';
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
import TicketQueuePage from '../../../messages/TicketQueuePage';
import { selectCurrentUser } from '../../../../store/slices/authSlice';
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
  const user = useSelector(selectCurrentUser);

  if (!hasAnyPermission(user, permissions)) {
    return <Navigate to="/private" replace />;
  }

  return children;
};

const PrivateContent = () => (
  <Routes>
    <Route path="user/edit/:id" element={wrap(Settings)} />
    <Route path="user/:id" element={wrap(UserProfile)} />
    <Route path="user/invite-tree" element={<InviteTree />} />
    <Route path="invite" element={<InviteForm />} />

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
        <StaffGate permissions={['admin']}>
          <UserRankFormPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/user-ranks/:id/edit"
      element={
        <StaffGate permissions={['admin']}>
          <UserRankFormPage />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools/user-ranks"
      element={
        <StaffGate permissions={['admin']}>
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
        <StaffGate permissions={['staff', 'admin']}>
          <RatioPolicyPanel />
        </StaffGate>
      }
    />
    <Route
      path="staff/tools"
      element={
        <StaffGate
          permissions={[
            'staff',
            'admin',
            'forums_manage',
            'forums_moderate',
            'communities_manage',
            'news_manage',
            'users_edit'
          ]}
        >
          <Toolbox />
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
    <Route path="contribute/list" element={wrap(ContributionsPage)} />
    <Route path="contribute" element={wrap(ContributeForm)} />

    <Route path="requests/new" element={wrap(CreateRequestForm)} />
    <Route path="requests/:id" element={wrap(RequestDetailPage)} />
    <Route path="requests" element={wrap(RequestsPage)} />

    <Route path="collages/new" element={wrap(CollageCreate)} />
    <Route path="collages/:id/edit" element={wrap(CollageEdit)} />
    <Route path="collages/:id" element={wrap(CollageDetail)} />
    <Route path="collages" element={wrap(CollageBrowse)} />

    <Route path="messages/tickets/new" element={wrap(NewTicketForm)} />
    <Route path="messages/tickets" element={wrap(MyTicketsPage)} />
    <Route path="messages/new" element={wrap(ComposeForm)} />
    <Route path="messages/sent" element={wrap(SentboxPage)} />
    <Route path="messages/:id" element={wrap(ConversationView)} />
    <Route path="messages" element={wrap(InboxPage)} />

    <Route
      path="staff/tickets"
      element={
        <StaffGate permissions={['staff', 'admin']}>
          <TicketQueuePage />
        </StaffGate>
      }
    />
    <Route
      path="staff/inbox/responses"
      element={
        <StaffGate permissions={['staff', 'admin']}>
          <CannedResponsesPage />
        </StaffGate>
      }
    />

    <Route
      path="staff/reports"
      element={
        <StaffGate permissions={['staff', 'admin']}>
          <ReportsQueuePage />
        </StaffGate>
      }
    />
    <Route path="staff/reports/:id" element={wrap(ReportDetailPage)} />

    <Route path="reports/new" element={wrap(ReportForm)} />
    <Route path="reports/mine" element={wrap(MyReportsPage)} />
    <Route path="reports/:id" element={wrap(ReportDetailPage)} />

    <Route path="" element={<PrivateHomepage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default PrivateContent;
