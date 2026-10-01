import { screen } from '@testing-library/react';
import { renderWithProviders, createTestStore } from '../testUtils';
import ProfileSidebar from '../../components/profile/view/ProfileSidebar';
import {
  showsInviteTreeLink,
  type ProfileView
} from '../../components/profile/view/profileView';
import { setCredentials } from '../../store/slices/authSlice';
import type { AuthUser } from '../../types';

// A member's profile links to their invite tree for an `invites_manage` viewer
// (#423): never your own, hidden when the member is known to have invited
// nobody, shown when the count is unknown because the member hides ratio stats.

jest.mock('../../components/profile/PercentileRankings', () => ({
  __esModule: true,
  default: () => null
}));

const viewer = (permissions: Record<string, boolean>, id = 1): AuthUser =>
  ({
    id,
    username: 'viewer',
    avatar: null,
    userRank: { id: 9, name: 'Rank', level: 100, permissions }
  }) as unknown as AuthUser;

const community = (direct: number) => ({
  friends: 0,
  invites: { direct, total: direct, depth: direct ? 1 : 0 },
  reputation: { score: 0, dimensions: [] }
});

/** Member #2's profile; `community` null means the viewer can't see it. */
const profile = (memberCommunity: ReturnType<typeof community> | null) =>
  ({
    id: 2,
    username: 'member',
    avatar: null,
    stats: { contributed: null, consumed: null, ratio: null, buffer: null },
    community: memberCommunity,
    activitySummary: {
      contributions: 0,
      requestsCreated: 0,
      requestsFilled: 0,
      forumTopics: 0,
      forumPosts: 0,
      collagesStarted: 0,
      comments: 0
    },
    percentiles: null
  }) as unknown as ProfileView;

const manager = viewer({ invites_manage: true });

describe('showsInviteTreeLink (#423)', () => {
  it.each([
    [
      'an invites_manage viewer, member has invitees',
      manager,
      profile(community(2)),
      true
    ],
    ['the count is unknown (ratio stats hidden)', manager, profile(null), true],
    ['an admin', viewer({ admin: true }), profile(community(1)), true],
    [
      'the member is known to have invited nobody',
      manager,
      profile(community(0)),
      false
    ],
    [
      'a viewer without invites_manage',
      viewer({}),
      profile(community(2)),
      false
    ],
    [
      'your own profile',
      viewer({ invites_manage: true }, 2),
      profile(community(2)),
      false
    ],
    ['no signed-in viewer', null, profile(community(2)), false]
  ])('%s', (_case, who, member, expected) => {
    expect(showsInviteTreeLink(who, member)).toBe(expected);
  });
});

describe('ProfileSidebar invite tree link (#423)', () => {
  const render = (who: AuthUser, member: ProfileView) => {
    const store = createTestStore();
    store.dispatch(setCredentials(who));
    return renderWithProviders(<ProfileSidebar profile={member} />, {
      store
    });
  };

  it("links to the member's invite tree for an invites_manage viewer", () => {
    render(manager, profile(community(2)));

    expect(screen.getByRole('link', { name: /invite tree/i })).toHaveAttribute(
      'href',
      '/user/2/invite-tree'
    );
  });

  it('shows no link without the permission', () => {
    render(viewer({}), profile(community(2)));

    expect(screen.queryByRole('link', { name: /invite tree/i })).toBeNull();
  });
});
