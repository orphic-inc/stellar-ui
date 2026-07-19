import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PublicLanding from '../../components/pages/public/PublicLanding';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

let mockInstallStatus: { registrationStatus: string } | undefined = undefined;

jest.mock('../../store/services/installApi', () => ({
  useGetInstallStatusQuery: () => ({ data: mockInstallStatus })
}));

describe('PublicLanding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInstallStatus = undefined;
  });

  it('renders Stellar heading and Sign In link', () => {
    renderWithProviders(<PublicLanding />);
    expect(
      screen.getByRole('heading', { name: /stellar/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows Register link when registration is open', () => {
    mockInstallStatus = { registrationStatus: 'open' };
    renderWithProviders(<PublicLanding />);
    expect(
      screen.getByRole('link', { name: /^register$/i })
    ).toBeInTheDocument();
  });

  it('hides Register when registration is not open', () => {
    mockInstallStatus = { registrationStatus: 'invite' };
    renderWithProviders(<PublicLanding />);
    expect(
      screen.queryByRole('link', { name: /^register$/i })
    ).not.toBeInTheDocument();
  });
});
