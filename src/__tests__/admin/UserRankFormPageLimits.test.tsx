import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserRankFormPage from '../../components/admin/UserRankFormPage';
import { RANK_LIMITS } from '../../components/admin/RankFormFields';

// The rank editor's nullable limits (#370, #342): a number plus an "Unlimited"
// checkbox, since null is unlimited and 0 is none for every one of them
// (stellar-api#881). Also the rank's colour and badge (#342). The mocks match
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

const resolves = () => ({ unwrap: () => Promise.resolve({}) });

const editRank = (fields: Record<string, unknown> = {}) => ({
  data: { id: 3, level: 500, name: 'Staff', permissions: {}, ...fields },
  isLoading: false
});

const startCreate = () => {
  mockUseParams.mockReturnValue({});
  mockGetUserRankByIdQuery.mockReturnValue({ data: undefined });
};

const startEdit = (fields: Record<string, unknown> = {}) => {
  mockUseParams.mockReturnValue({ id: '3' });
  mockGetUserRankByIdQuery.mockReturnValue(editRank(fields));
};

const nameLoaded = () =>
  waitFor(() => expect(screen.getByLabelText(/^name$/i)).toHaveValue('Staff'));

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateUserRank.mockReturnValue(resolves());
  mockUpdateUserRank.mockReturnValue(resolves());
  mockGetPromotionRules.mockReturnValue({ data: [] });
  mockGetUserRanks.mockReturnValue({ data: [] });
});

describe.each(RANK_LIMITS)(
  'UserRankFormPage — $label limit (#370, #342)',
  ({ name, label }) => {
    const limit = () =>
      screen.getByLabelText(new RegExp(`^${label}$`, 'i')) as HTMLInputElement;
    const unlimited = () =>
      screen.getByRole('checkbox', {
        name: `Unlimited ${label}`
      }) as HTMLInputElement;
    const create = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/^name$/i), 'New');
      await user.click(screen.getByRole('button', { name: /^create$/i }));
    };

    it('creates a rank with none by default', async () => {
      startCreate();
      const user = userEvent.setup();
      renderWithProviders(<UserRankFormPage />);
      expect(unlimited().checked).toBe(false);
      expect(limit().value).toBe('0');
      await create(user);

      await waitFor(() =>
        expect(mockCreateUserRank).toHaveBeenCalledWith(
          expect.objectContaining({ [name]: 0 })
        )
      );
    });

    it('sends null when Unlimited is ticked, and disables the number', async () => {
      startCreate();
      const user = userEvent.setup();
      renderWithProviders(<UserRankFormPage />);
      await user.click(unlimited());
      expect(limit().disabled).toBe(true);
      await create(user);

      await waitFor(() =>
        expect(mockCreateUserRank).toHaveBeenCalledWith(
          expect.objectContaining({ [name]: null })
        )
      );
    });

    it('sends a typed 0 as 0, none', async () => {
      startEdit({ [name]: 4 });
      const user = userEvent.setup();
      renderWithProviders(<UserRankFormPage />);
      await waitFor(() => expect(limit().value).toBe('4'));
      await user.clear(limit());
      await user.type(limit(), '0');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(mockUpdateUserRank).toHaveBeenCalledWith(
          expect.objectContaining({ [name]: 0 })
        )
      );
    });

    it('prefills an unlimited rank with Unlimited ticked', async () => {
      startEdit({ [name]: null });
      renderWithProviders(<UserRankFormPage />);
      await waitFor(() => expect(unlimited().checked).toBe(true));
    });

    it('restores the number when Unlimited is cleared', async () => {
      startEdit({ [name]: 5 });
      const user = userEvent.setup();
      renderWithProviders(<UserRankFormPage />);
      await waitFor(() => expect(limit().value).toBe('5'));
      await user.click(unlimited());
      await user.click(unlimited());
      expect(limit().value).toBe('5');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(mockUpdateUserRank).toHaveBeenCalledWith(
          expect.objectContaining({ [name]: 5 })
        )
      );
    });

    it('reads an absent limit as none, never as unlimited', async () => {
      startEdit();
      renderWithProviders(<UserRankFormPage />);
      await nameLoaded();
      expect(unlimited().checked).toBe(false);
      expect(limit().value).toBe('0');
    });
  }
);

describe('UserRankFormPage — colour and badge (#342)', () => {
  const color = () => screen.getByLabelText(/^color$/i);
  const badge = () => screen.getByLabelText(/^badge$/i);

  it('prefills both and previews the name in them', async () => {
    startEdit({ color: '#e22a2a', badge: '★' });
    renderWithProviders(<UserRankFormPage />);
    await nameLoaded();
    expect(color()).toHaveValue('#e22a2a');
    expect(badge()).toHaveValue('★');
    expect(screen.getByTestId('rank-preview')).toHaveTextContent('★ Staff');
    expect(screen.getByTestId('rank-preview')).toHaveStyle({
      color: '#e22a2a'
    });
  });

  it('sends an emptied colour and badge as empty strings, which clear them', async () => {
    startEdit({ color: '#e22a2a', badge: '★' });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await nameLoaded();
    await user.clear(color());
    await user.clear(badge());
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ color: '', badge: '' })
      )
    );
  });

  it('sends what staff typed on create', async () => {
    startCreate();
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'Veteran');
    await user.type(color(), '#3a9bd9');
    await user.type(badge(), '✦');
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(mockCreateUserRank).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#3a9bd9', badge: '✦' })
      )
    );
  });
});

// stellar-api#882: the entry rank keeps level 100, and staff see why.
describe('UserRankFormPage — a refused save', () => {
  it("shows the api's reason", async () => {
    startEdit({ level: 100, name: 'Staff' });
    const msg = 'New members join at level 100, so that rank keeps its level';
    mockUpdateUserRank.mockReturnValue({
      unwrap: () => Promise.reject({ status: 409, data: { msg } })
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankFormPage />);
    await nameLoaded();
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ msg, alertType: 'danger' })
        })
      )
    );
  });
});
