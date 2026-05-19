import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserBrowsePage from '../../components/users/UserBrowsePage';

const mockUseSearchUsersQuery = jest.fn();
const mockUseGetMeQuery = jest.fn();
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/searchApi', () => ({
  useSearchUsersQuery: (...args: unknown[]) => mockUseSearchUsersQuery(...args)
}));

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => mockUseSearchParams(),
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  )
}));

const makeUser = (id: number) => ({
  id,
  username: `user${id}`,
  createdAt: '2024-01-01T00:00:00Z',
  lastLogin: '2026-05-17T00:00:00Z',
  ratio: '2.5',
  disabled: false,
  userRank: { id: 1, name: 'Member', color: null }
});

describe('UserBrowsePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(),
      mockSetSearchParams
    ]);
  });

  it('shows spinner while loading', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<UserBrowsePage />);
    expect(screen.getByText(/failed to load results/i)).toBeInTheDocument();
  });

  it('shows no users message on empty result', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it('renders user list for a regular user (no privileged columns)', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: {
        data: [makeUser(1), makeUser(2)],
        meta: { total: 2, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.queryByText(/last login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ratio/i)).not.toBeInTheDocument();
  });

  it('shows privileged columns for staff users', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 2, userRank: { permissions: { staff: true } } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: {
        data: [makeUser(1)],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    expect(screen.getAllByText(/last login/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^ratio$/i).length).toBeGreaterThan(0);
    expect(screen.getByText('2.50')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('shows disabled status for disabled users (staff view)', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 2, userRank: { permissions: { staff: true } } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: {
        data: [{ ...makeUser(3), disabled: true }],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    expect(screen.getAllByText('Disabled').length).toBeGreaterThan(0);
  });

  it('updates search params on form submit', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    await user.type(screen.getByPlaceholderText(/search users/i), 'alice');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('q')).toBe('alice');
  });

  it('shows ∞ when ratio is null (privileged view)', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 2, userRank: { permissions: { staff: true } } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: {
        data: [{ ...makeUser(9), ratio: null }],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    expect(screen.getByText('∞')).toBeInTheDocument();
  });

  it('renders pagination buttons when totalPages > 1', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: {
        data: [makeUser(1)],
        meta: { total: 50, totalPages: 2 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });

  it('calls setSearchParams with new page when pagination button is clicked', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: {
        data: [makeUser(1)],
        meta: { total: 50, totalPages: 2 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    await user.click(screen.getByRole('button', { name: '2' }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('page')).toBe('2');
  });

  it('includes disabled filter in search params when privileged user submits', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 2, userRank: { permissions: { staff: true } } }
    });
    mockUseSearchUsersQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserBrowsePage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /status/i }),
      'true'
    );
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('disabled')).toBe('true');
  });
});
