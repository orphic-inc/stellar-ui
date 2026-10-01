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

// A save that moves the rank on or off the auto-managed ladder (#425): the api
// reports the new `autoManaged`, and the page names the three jobs it changes.
describe('UserRankFormPage — a save that flips autoManaged (#425)', () => {
  const saveFrom = async (before: boolean, after: boolean) => {
    mockGetUserRankByIdQuery.mockReturnValue({
      data: {
        id: 2,
        level: 450,
        name: 'Stellarige',
        permissions: {},
        autoManaged: before
      },
      isLoading: false
    });
    mockUpdateUserRank.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 2, autoManaged: after })
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() =>
      expect(
        (screen.getByLabelText(/^level$/i) as HTMLInputElement).value
      ).toBe('450')
    );
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(mockUpdateUserRank).toHaveBeenCalled());
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
    mockUseParams.mockReturnValue({ id: '2' });
    mockGetPromotionRules.mockReturnValue({ data: [] });
    mockGetUserRanks.mockReturnValue({ data: [] });
  });

  it('stays and warns when the rank leaves the auto-managed ladder', async () => {
    await saveFrom(true, false);

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(/no longer auto-managed/i);
    expect(notice).toHaveTextContent(
      /auto-promoted or demoted, disabled for inactivity, or granted invites/i
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('stays and says so when the rank joins the auto-managed ladder', async () => {
    await saveFrom(false, true);

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(/is now auto-managed/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('returns to the rank list when autoManaged held', async () => {
    await saveFrom(true, true);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/staff/tools/user-ranks')
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
