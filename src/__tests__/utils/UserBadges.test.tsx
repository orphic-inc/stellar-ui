import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import UserBadges from '../../components/layout/UserBadges';

describe('UserBadges', () => {
  it('renders nothing when no badges apply', () => {
    const { container } = renderWithProviders(
      <UserBadges disabled={false} warned={null} isDonor={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows Disabled badge when disabled is true', () => {
    renderWithProviders(<UserBadges disabled={true} />);
    expect(screen.getByLabelText('Disabled')).toBeInTheDocument();
  });

  it('shows Warned badge when warned is truthy', () => {
    renderWithProviders(<UserBadges warned={true} />);
    expect(screen.getByLabelText('Warned')).toBeInTheDocument();
  });

  it('shows Donor badge when isDonor is true', () => {
    renderWithProviders(<UserBadges isDonor={true} />);
    expect(screen.getByLabelText('Donor')).toBeInTheDocument();
  });

  it('shows multiple badges simultaneously', () => {
    renderWithProviders(
      <UserBadges disabled={true} warned={true} isDonor={true} />
    );
    expect(screen.getByLabelText('Disabled')).toBeInTheDocument();
    expect(screen.getByLabelText('Warned')).toBeInTheDocument();
    expect(screen.getByLabelText('Donor')).toBeInTheDocument();
  });
});
