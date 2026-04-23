import { Route, Routes } from 'react-router-dom';
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
import ContributeForm from '../../../contribute/ContributeForm';
import ContributionsPage from '../../../contribute/ContributionsPage';

import Toolbox from '../../../admin/Toolbox';
import NewUserForm from '../../../admin/NewUserForm';
import UserRankManager from '../../../admin/UserRankManager';
import UserRankFormPage from '../../../admin/UserRankFormPage';
import ForumCategoryControlPanel from '../../../admin/ForumCategoryControlPanel';
import ForumControlPanel from '../../../admin/ForumControlPanel';
import CommunityManager from '../../../admin/CommunityManager';
import NewsManager from '../../../admin/NewsManager';

const wrap = (Component: React.ComponentType) => (
  <ErrorBoundary FallbackComponent={FallbackComponent}>
    <Component />
  </ErrorBoundary>
);

const PrivateContent = () => (
  <Routes>
    <Route path="user/edit/:id" element={wrap(Settings)} />
    <Route path="user/:id" element={wrap(UserProfile)} />
    <Route path="user/invite-tree" element={<InviteTree />} />
    <Route path="invite" element={<InviteForm />} />

    <Route path="staff/tools/user/new" element={<NewUserForm />} />
    <Route path="staff/tools/user-ranks/new" element={<UserRankFormPage />} />
    <Route
      path="staff/tools/user-ranks/:id/edit"
      element={<UserRankFormPage />}
    />
    <Route path="staff/tools/user-ranks" element={<UserRankManager />} />
    <Route
      path="staff/tools/categories"
      element={<ForumCategoryControlPanel />}
    />
    <Route path="staff/tools/forums" element={<ForumControlPanel />} />
    <Route path="staff/tools/communities" element={<CommunityManager />} />
    <Route path="staff/tools/news" element={<NewsManager />} />
    <Route path="staff/tools" element={<Toolbox />} />

    <Route
      path="forums/:forumId/topics/:forumTopicId"
      element={wrap(ForumTopicPage)}
    />
    <Route path="forums/:forumId/new" element={<NewTopicForm />} />
    <Route path="forums/:forumId" element={wrap(ForumPage)} />
    <Route path="forums" element={wrap(ForumCategoryPage)} />

    <Route
      path="communities/:communityId/releases/:releaseId"
      element={wrap(ReleasePage)}
    />
    <Route path="communities/:communityId" element={wrap(CommunityPage)} />
    <Route path="communities" element={wrap(CommunitiesPage)} />
    <Route path="contribute/list" element={wrap(ContributionsPage)} />
    <Route path="contribute" element={wrap(ContributeForm)} />

    <Route path="" element={<PrivateHomepage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default PrivateContent;
