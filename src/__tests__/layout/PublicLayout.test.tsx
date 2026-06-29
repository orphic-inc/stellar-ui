import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PublicLayout from '../../components/pages/public/PublicLayout';

const mockUseGetInstallStatusQuery = jest.fn();

jest.mock('../../store/services/installApi', () => ({
  useGetInstallStatusQuery: () => mockUseGetInstallStatusQuery()
}));

jest.mock('../../components/layout/Alert', () => ({
  __esModule: true,
  default: () => <div data-testid="alert-banner">Alert</div>
}));

describe('PublicLayout', () => {
  beforeEach(() => {
    mockUseGetInstallStatusQuery.mockReset();
  });

  it('shows the register link when registration is open', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { registrationStatus: 'open' }
    });

    renderWithProviders(
      <PublicLayout>
        <div>Child content</div>
      </PublicLayout>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.getByTestId('alert-banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
      'href',
      '/register'
    );
    // Register is the filled CTA control (data-st contract)
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
      'data-st',
      'control'
    );
  });

  it('hides the register link when registration is not open', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { registrationStatus: 'invite' }
    });

    renderWithProviders(
      <PublicLayout>
        <div>Child content</div>
      </PublicLayout>
    );

    expect(
      screen.queryByRole('link', { name: 'Register' })
    ).not.toBeInTheDocument();
  });
});
