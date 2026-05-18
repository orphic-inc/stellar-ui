import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import Top10Layout from '../../components/top10/Top10Layout';

const mockUseGetMeQuery = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/private/top10/releases' }),
  Outlet: () => <div data-testid="outlet" />,
  NavLink: ({
    to,
    children,
    className
  }: {
    to: string;
    children: React.ReactNode;
    className: ({ isActive }: { isActive: boolean }) => string;
  }) => (
    <a href={`/private/top10/${to}`} className={className({ isActive: false })}>
      {children}
    </a>
  ),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  )
}));

describe('Top10Layout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders standard tabs for a regular user', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    renderWithProviders(<Top10Layout />);
    expect(screen.getByRole('link', { name: 'Releases' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Votes' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'History' })
    ).not.toBeInTheDocument();
  });

  it('shows History tab for staff users', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 2, userRank: { permissions: { staff: true } } }
    });
    renderWithProviders(<Top10Layout />);
    expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument();
  });

  it('shows History tab for admin users', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 3, userRank: { permissions: { admin: true } } }
    });
    renderWithProviders(<Top10Layout />);
    expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument();
  });

  it('renders the outlet for child routes', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    renderWithProviders(<Top10Layout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
