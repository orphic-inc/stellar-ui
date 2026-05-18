import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PublicLanding from '../../components/pages/public/PublicLanding';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

let mockMe: { id: number } | undefined = undefined;
let mockInstallStatus: { registrationStatus: string } | undefined = undefined;

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => ({ data: mockMe })
}));

jest.mock('../../store/services/installApi', () => ({
  useGetInstallStatusQuery: () => ({ data: mockInstallStatus })
}));

describe('PublicLanding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMe = undefined;
    mockInstallStatus = undefined;
  });

  it('renders Stellar heading and Sign In link', () => {
    renderWithProviders(<PublicLanding />);
    expect(
      screen.getByRole('heading', { name: /stellar/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows Request Access link when registration is open', () => {
    mockInstallStatus = { registrationStatus: 'open' };
    renderWithProviders(<PublicLanding />);
    expect(
      screen.getByRole('link', { name: /request access/i })
    ).toBeInTheDocument();
  });

  it('hides Request Access when registration is not open', () => {
    mockInstallStatus = { registrationStatus: 'invite' };
    renderWithProviders(<PublicLanding />);
    expect(
      screen.queryByRole('link', { name: /request access/i })
    ).not.toBeInTheDocument();
  });

  it('navigates to /private when user is logged in', () => {
    mockMe = { id: 1 };
    renderWithProviders(<PublicLanding />);
    expect(mockNavigate).toHaveBeenCalledWith('/private');
  });
});
