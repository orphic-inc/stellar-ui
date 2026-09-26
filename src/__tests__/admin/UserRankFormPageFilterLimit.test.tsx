import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserRankFormPage from '../../components/admin/UserRankFormPage';

// The rank editor's notification filter limit (#370): a number plus an
// "Unlimited" checkbox, since null is unlimited and 0 is none. The mocks match
// UserRankFormPage.test.tsx.

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

describe('UserRankFormPage — notification filter limit (#370)', () => {
  const limit = () =>
    screen.getByLabelText(/^notification filters$/i) as HTMLInputElement;
  const unlimited = () =>
    screen.getByRole('checkbox', {
      name: 'Unlimited Notification Filters'
    }) as HTMLInputElement;
  const editRank = (notificationFilterLimit?: number | null) => ({
    data: {
      id: 3,
      level: 500,
      name: 'Staff',
      permissions: {},
      ...(notificationFilterLimit === undefined
        ? {}
        : { notificationFilterLimit })
    },
    isLoading: false
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUpdateUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockGetPromotionRules.mockReturnValue({ data: [] });
    mockGetUserRanks.mockReturnValue({ data: [] });
  });

  it('creates a rank with none by default', async () => {
    mockUseParams.mockReturnValue({});
    mockGetUserRankByIdQuery.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'New');
    expect(unlimited().checked).toBe(false);
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(mockCreateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ notificationFilterLimit: 0 })
      )
    );
  });

  it('sends null when Unlimited is ticked, and disables the number', async () => {
    mockUseParams.mockReturnValue({});
    mockGetUserRankByIdQuery.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'New');
    await user.click(unlimited());
    expect(limit().disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(mockCreateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ notificationFilterLimit: null })
      )
    );
  });

  it('prefills an unlimited rank with Unlimited ticked', async () => {
    mockUseParams.mockReturnValue({ id: '3' });
    mockGetUserRankByIdQuery.mockReturnValue(editRank(null));
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() => expect(unlimited().checked).toBe(true));
  });

  it('restores the number when Unlimited is cleared', async () => {
    mockUseParams.mockReturnValue({ id: '3' });
    mockGetUserRankByIdQuery.mockReturnValue(editRank(5));
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() => expect(limit().value).toBe('5'));
    await user.click(unlimited());
    await user.click(unlimited());
    expect(limit().value).toBe('5');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ notificationFilterLimit: 5 })
      )
    );
  });

  it('reads an absent limit as none, never as unlimited', async () => {
    mockUseParams.mockReturnValue({ id: '3' });
    mockGetUserRankByIdQuery.mockReturnValue(editRank(undefined));
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() =>
      expect(screen.getByLabelText(/^name$/i)).toHaveValue('Staff')
    );
    expect(unlimited().checked).toBe(false);
    expect(limit().value).toBe('0');
  });
});
