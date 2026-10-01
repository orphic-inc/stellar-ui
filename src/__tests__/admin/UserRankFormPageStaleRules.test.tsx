import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserRankFormPage from '../../components/admin/UserRankFormPage';

// A rank save that takes promotion rules off the ladder (#383): the api saves
// it and reports the rules as `staleRules` (stellar-api#718), so the page stays
// open and links each rule's rank. The mocks match UserRankFormPage.test.tsx.

const mockGetUserRankByIdQuery = jest.fn();
const mockCreateUserRank = jest.fn();
const mockUpdateUserRank = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockUseParams = jest.fn();
const mockGetPromotionRules = jest.fn();
const mockGetUserRanks = jest.fn();
const mockCreatePromotionRule = jest.fn();
const mockUpdatePromotionRule = jest.fn();

const mockPermissionCatalog = [
  {
    key: 'forums',
    title: 'Forums',
    permissions: [
      {
        key: 'forums_read',
        label: 'Read forums',
        description: 'Access forums.'
      }
    ]
  },
  {
    key: 'administration',
    title: 'Administration',
    permissions: [
      {
        key: 'admin',
        label: 'Administrator',
        description: 'Global administrative override.'
      }
    ]
  }
];

jest.mock('../../store/services/userApi', () => ({
  useGetUserRankByIdQuery: (...args: unknown[]) =>
    mockGetUserRankByIdQuery(...args),
  useCreateUserRankMutation: () => [mockCreateUserRank],
  useUpdateUserRankMutation: () => [mockUpdateUserRank],
  useGetStaffGroupsQuery: () => ({ data: [] }),
  useGetPermissionCatalogQuery: () => ({ data: mockPermissionCatalog }),
  useGetPromotionRulesQuery: () => mockGetPromotionRules(),
  useGetUserRanksQuery: () => mockGetUserRanks(),
  useCreatePromotionRuleMutation: () => [mockCreatePromotionRule],
  useUpdatePromotionRuleMutation: () => [mockUpdatePromotionRule]
}));

jest.mock('../../store/services/forumApi', () => ({
  useGetForumCategoriesQuery: () => ({
    data: [
      {
        id: 1,
        name: 'Music',
        forums: [{ id: 7, name: 'Jazz', minClassRead: 200 }]
      }
    ]
  })
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

describe('UserRankFormPage — rules a save took off the ladder (#383)', () => {
  const staleRule = {
    id: 8,
    fromRankId: 2,
    fromRankName: 'Member',
    toRankId: 3,
    toRankName: 'Power User',
    minContributed: '0',
    minRatio: 0,
    minContributions: 0,
    minAccountAgeDays: 0,
    extra: null,
    enabled: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  };

  const save = async (response: Record<string, unknown>) => {
    mockUpdateUserRank.mockReturnValue({
      unwrap: () => Promise.resolve(response)
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() =>
      expect(
        (screen.getByLabelText(/^level$/i) as HTMLInputElement).value
      ).toBe('150')
    );
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(mockUpdateUserRank).toHaveBeenCalled());
  };

  const scrollIntoView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom has no scrollIntoView.
    Element.prototype.scrollIntoView = scrollIntoView;
    mockUseParams.mockReturnValue({ id: '2' });
    mockGetUserRankByIdQuery.mockReturnValue({
      data: { id: 2, level: 150, name: 'Member', permissions: {} },
      isLoading: false
    });
    mockGetPromotionRules.mockReturnValue({ data: [] });
    mockGetUserRanks.mockReturnValue({ data: [] });
  });

  it('stays on the page and links the promotion section of each rule', async () => {
    await save({ id: 2, staleRules: [staleRule] });

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(/off the ladder/i);
    expect(
      screen.getByRole('link', { name: 'Member → Power User' })
    ).toHaveAttribute(
      'href',
      '/staff/tools/user-ranks/2/edit#promotion-criteria'
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    // The notice is at the top; the Save button that raised it is not.
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
  });

  it('returns to the rank list when no rule was stranded', async () => {
    await save({ id: 2 });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/staff/tools/user-ranks')
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
