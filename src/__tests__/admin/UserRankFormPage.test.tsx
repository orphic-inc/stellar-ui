import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserRankFormPage from '../../components/admin/UserRankFormPage';

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

describe('UserRankFormPage — create mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: undefined });
    mockGetUserRankByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false
    });
    mockCreateUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('renders "New User Rank" heading and Create button', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByText(/new user rank/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^create$/i })
    ).toBeInTheDocument();
  });

  it('shows Name and Level fields', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^level$/i)).toBeInTheDocument();
    expect(screen.getByText(/secondary class/i)).toBeInTheDocument();
  });

  it('shows permission checkboxes', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByText(/read forums/i)).toBeInTheDocument();
    expect(screen.getByText(/administrator/i)).toBeInTheDocument();
  });

  it('does not render the promotion-criteria section in create mode', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.queryByText(/promotion criteria/i)).not.toBeInTheDocument();
  });

  it('calls createUserRank with form data and navigates on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'Veteran');
    await user.clear(screen.getByLabelText(/^level$/i));
    await user.type(screen.getByLabelText(/^level$/i), '300');
    await user.click(
      screen.getByRole('checkbox', { name: /secondary class/i })
    );
    await user.click(screen.getByRole('checkbox', { name: /jazz/i }));
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    await waitFor(() => {
      expect(mockCreateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Veteran',
          secondary: true,
          permittedForumIds: [7]
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/staff/tools/user-ranks');
    });
  });

  it('dispatches danger alert on create failure', async () => {
    mockCreateUserRank.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'Broken');
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });
});

describe('UserRankFormPage — edit mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '3' });
    mockGetUserRankByIdQuery.mockReturnValue({
      data: {
        id: 3,
        level: 500,
        name: 'Staff',
        permissions: { staff: true, forums_moderate: true },
        secondary: true,
        permittedForumIds: [7]
      },
      isLoading: false
    });
    mockUpdateUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockGetPromotionRules.mockReturnValue({ data: [] });
    mockGetUserRanks.mockReturnValue({ data: [] });
    mockCreatePromotionRule.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    mockUpdatePromotionRule.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('renders "Edit User Rank" heading and Save Changes button', () => {
    renderWithProviders(<UserRankFormPage />);
    expect(screen.getByText(/edit user rank/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save changes/i })
    ).toBeInTheDocument();
  });

  it('prefills name and level from existing rank', async () => {
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() => {
      expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe(
        'Staff'
      );
    });
    expect(
      (
        screen.getByRole('checkbox', {
          name: /secondary class/i
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
  });

  it('shows spinner when isLoading is true in edit mode', () => {
    mockGetUserRankByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<UserRankFormPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('prefills empty permissions object when existing.permissions is null', async () => {
    mockGetUserRankByIdQuery.mockReturnValue({
      data: { id: 4, level: 100, name: 'Basic', permissions: null },
      isLoading: false
    });
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() => {
      expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe(
        'Basic'
      );
    });
  });

  it('dispatches danger alert on update failure', async () => {
    mockUpdateUserRank.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() =>
      expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe(
        'Staff'
      )
    );
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Failed to update user rank.',
            alertType: 'danger'
          })
        })
      );
    });
  });

  it('calls updateUserRank and navigates on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() =>
      expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe(
        'Staff'
      )
    );
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(mockUpdateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3 })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/staff/tools/user-ranks');
    });
  });
});

describe('UserRankFormPage — promotion criteria (#170)', () => {
  const existingRule = {
    id: 11,
    fromRankId: 3,
    fromRankName: 'Elite',
    toRankId: 4,
    toRankName: 'Stellarific',
    minContributed: '536870912000',
    minRatio: 1.05,
    minContributions: 500,
    minAccountAgeDays: 56,
    extra: null,
    enabled: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '3' });
    mockGetUserRankByIdQuery.mockReturnValue({
      data: { id: 3, level: 300, name: 'Elite', permissions: {} },
      isLoading: false
    });
    mockUpdateUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockGetUserRanks.mockReturnValue({
      data: [
        { id: 3, name: 'Elite', level: 300, permissions: {} },
        { id: 4, name: 'Stellarific', level: 350, permissions: {} }
      ]
    });
    mockCreatePromotionRule.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    mockUpdatePromotionRule.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('prefills the promotion fields from the outgoing rule', async () => {
    mockGetPromotionRules.mockReturnValue({ data: [existingRule] });
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() => {
      expect(
        (screen.getByLabelText(/min contributed/i) as HTMLInputElement).value
      ).toBe('536870912000');
    });
    expect(
      (screen.getByLabelText(/promotes to/i) as HTMLSelectElement).value
    ).toBe('4');
  });

  it('updates the existing rule with minContributed kept as a string', async () => {
    mockGetPromotionRules.mockReturnValue({ data: [existingRule] });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await waitFor(() =>
      expect(
        (screen.getByLabelText(/min contributed/i) as HTMLInputElement).value
      ).toBe('536870912000')
    );
    await user.click(
      screen.getByRole('button', { name: /save promotion criteria/i })
    );
    await waitFor(() => {
      expect(mockUpdatePromotionRule).toHaveBeenCalledWith(
        expect.objectContaining({ id: 11, minContributed: '536870912000' })
      );
    });
    expect(typeof mockUpdatePromotionRule.mock.calls[0][0].minContributed).toBe(
      'string'
    );
  });

  it('creates a rule when none exists for this rank', async () => {
    mockGetPromotionRules.mockReturnValue({ data: [] });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.selectOptions(screen.getByLabelText(/promotes to/i), '4');
    await user.click(
      screen.getByRole('button', { name: /save promotion criteria/i })
    );
    await waitFor(() => {
      expect(mockCreatePromotionRule).toHaveBeenCalledWith(
        expect.objectContaining({ fromRankId: 3, toRankId: 4 })
      );
    });
  });
});
