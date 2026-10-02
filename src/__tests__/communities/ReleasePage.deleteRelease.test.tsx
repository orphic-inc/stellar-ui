import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ReleasePage from '../../components/communities/ReleasePage';

/**
 * The release page hands DeleteReleaseButton (#429) the loaded contributions
 * count; the button itself decides whether to show (DeleteReleaseButton.test).
 * Kept apart from ReleasePage.test.tsx, which is already over the size limit.
 */
const mockContributions = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ communityId: '3', releaseId: '9' })
}));

jest.mock(
  '../../components/communities/DeleteReleaseButton',
  () =>
    function DeleteReleaseButton(props: Record<string, unknown>) {
      return <span data-testid="delete-release">{JSON.stringify(props)}</span>;
    }
);

jest.mock('../../components/communities/useReleaseWorkbench', () => ({
  useReleaseWorkbench: () => ({
    release: {
      id: 9,
      title: 'Kind of Blue',
      year: 1959,
      group: null,
      credits: [],
      artist: null
    },
    community: { name: 'Jazz' },
    isLoading: false,
    tags: [],
    agg: { total: 0, ups: 0, score: 0 },
    historyEntries: [],
    pendingTag: '',
    editForm: {}
  })
}));

jest.mock('../../store/services/communityApi', () => ({
  useGetReleaseContributionsQuery: () => mockContributions()
}));

jest.mock('../../store/services/subscriptionApi', () => ({
  useGetCommentSubscriptionQuery: () => ({ data: undefined }),
  useSubscribeCommentsMutation: () => [jest.fn(), { isLoading: false }]
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleReleaseBookmarkMutation: () => [jest.fn(), { isLoading: false }]
}));

jest.mock('../../components/layout/CommentsSection', () => () => null);
jest.mock('../../components/communities/ReleaseGroupPanel', () => () => null);
jest.mock('../../components/communities/ReleaseCredits', () => () => null);
jest.mock('../../components/communities/EditionStack', () => () => null);

const passed = () =>
  JSON.parse(screen.getByTestId('delete-release').textContent ?? '{}');

describe('ReleasePage — delete release wiring (#429)', () => {
  it('passes the route ids and a count of zero for no contributions', () => {
    mockContributions.mockReturnValue({ data: [] });
    renderWithProviders(<ReleasePage />);
    expect(passed()).toEqual({
      communityId: 3,
      releaseId: 9,
      contributionCount: 0
    });
  });

  it('passes the count of loaded contributions', () => {
    mockContributions.mockReturnValue({ data: [{ id: 1 }, { id: 2 }] });
    renderWithProviders(<ReleasePage />);
    expect(passed().contributionCount).toBe(2);
  });

  it('passes no count while the contributions load', () => {
    mockContributions.mockReturnValue({ data: undefined });
    renderWithProviders(<ReleasePage />);
    expect(passed()).not.toHaveProperty('contributionCount');
  });
});
