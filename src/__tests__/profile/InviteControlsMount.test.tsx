/**
 * Where the staff invite controls mount on a profile (#414, stellar-api#655).
 *
 * The api serves `inviteCount` and `canInvite` to a rank holding only an invite
 * permission. `invites_edit` alone gets the Invites panel on its own, without
 * Staff Actions; `invites_manage` alone reads the balance in the sidebar.
 *
 * Renders the real profile against a real store and the real permission
 * helpers. Every api hook is a stub: the profile query answers the fixture.
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { createTestStore, renderWithProviders } from '../testUtils';
import UserProfile from '../../components/profile/UserProfile';
import { setCredentials } from '../../store/slices/authSlice';
import type { AuthUser } from '../../types';

jest.mock('dompurify', () => ({ sanitize: (html: string) => html }));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '42' })
}));

const mockProfile = {
  id: 42,
  username: 'alice',
  email: null,
  profile: { profileTitle: null, profileInfo: null, avatar: null },
  avatar: null,
  userRank: { name: 'Member', color: '#fff', displayStaff: false },
  inviteCount: 3,
  canInvite: true,
  dateRegistered: '2020-01-01',
  lastSeen: null,
  stats: { contributed: null, consumed: null, ratio: null, buffer: null },
  activitySummary: {
    contributions: 0,
    requestsCreated: 0,
    requestsFilled: 0,
    forumTopics: 0,
    forumPosts: 0,
    collagesStarted: 0,
    collageEntries: 0,
    comments: 0
  },
  donorPresentation: null,
  collageShelves: { featuredPersonalCollages: [], publicCollages: [] },
  percentiles: {
    contributed: null,
    consumed: null,
    contributions: { percentile: 70, rank: 7, total: 25, raw: 12 },
    forumPosts: { percentile: 50, rank: 12, total: 25, raw: 30 },
    requestsFilled: { percentile: 40, rank: 15, total: 25, raw: 4 },
    bountySpent: { percentile: 45, rank: 14, total: 25, raw: 100 },
    artistsAdded: { percentile: 30, rank: 17, total: 25, raw: 9 },
    overall: null
  },
  staffPmOverview: null,
  disabled: false,
  warned: null,
  staffBio: null,
  isDonor: false,
  recentContributions: [],
  recentSnatches: [],
  community: null
};

// Any hook: a mutation answers a trigger tuple, a query answers no data, and
// the profile query answers the fixture.
const hookStub = (name: string) =>
  name.endsWith('Mutation')
    ? () => [jest.fn(), { isLoading: false }]
    : name === 'useGetProfileByUserIdQuery'
      ? () => ({ data: mockProfile, isLoading: false, error: undefined })
      : () => ({ data: undefined, isLoading: false });

const stubModule = () =>
  new Proxy(
    { __esModule: true },
    {
      get: (target, prop) =>
        prop in target
          ? target[prop as keyof typeof target]
          : hookStub(String(prop))
    }
  );

jest.mock('../../store/services/userApi', () => stubModule());
jest.mock('../../store/services/profileApi', () => stubModule());
jest.mock('../../store/services/friendApi', () => stubModule());

const renderAs = (permissions: Record<string, boolean>) => {
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: 99,
      username: 'bob',
      avatar: null,
      userRank: { level: 300, name: 'Rank', color: '', permissions }
    } as AuthUser)
  );
  renderWithProviders(<UserProfile />, { store });
};

const invitesPanel = () =>
  screen.queryByText('Invites', { selector: '[data-st="colhead"]' });

describe('profile invite controls mount (#414)', () => {
  it('gives invites_edit alone the Invites panel, without Staff Actions', () => {
    renderAs({ invites_edit: true });

    expect(invitesPanel()).toBeInTheDocument();
    expect(screen.queryByText('Staff Actions')).not.toBeInTheDocument();
  });

  it('gives invites_manage alone the balance read-only, with no controls', () => {
    renderAs({ invites_manage: true });

    expect(screen.getByText('Invites:')).toBeInTheDocument();
    expect(invitesPanel()).not.toBeInTheDocument();
  });

  it('mounts the panel once, inside Staff Actions, for staff with invites_edit', () => {
    renderAs({ users_edit: true, invites_edit: true });

    expect(screen.getByText('Staff Actions')).toBeInTheDocument();
    expect(
      screen.getAllByText('Invites', { selector: '[data-st="colhead"]' })
    ).toHaveLength(1);
  });

  it('mounts nothing for a member with neither permission', () => {
    renderAs({});

    expect(invitesPanel()).not.toBeInTheDocument();
    expect(screen.queryByText('Staff Actions')).not.toBeInTheDocument();
  });
});
