import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import Top10Layout from '../../components/top10/Top10Layout';

const mockUseGetMeQuery = jest.fn();
let mockPathname = '/private/top10/releases';

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: mockPathname }),
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
    <a
      href={`/private/top10/${to}`}
      className={className({ isActive: mockPathname.endsWith(to) })}
    >
      {children}
    </a>
  ),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  )
}));

describe('Top10Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/private/top10/releases';
  });

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

  it('redirects to releases when pathname is exactly /private/top10', () => {
    mockPathname = '/private/top10';
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    renderWithProviders(<Top10Layout />);
    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      'releases'
    );
  });

  it('paints the heading from the data-st contract', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
    const { container } = renderWithProviders(<Top10Layout />);
    // The tab-strip paints from token utilities (no Role); the heading is prose.
    expect(
      container.querySelector('[data-st="prose"][data-st-strong]')
    ).toBeInTheDocument();
  });
});
