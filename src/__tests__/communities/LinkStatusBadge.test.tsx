import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import LinkStatusBadge from '../../components/communities/LinkStatusBadge';

describe('LinkStatusBadge', () => {
  it('shows "Link OK" for PASS status', () => {
    renderWithProviders(<LinkStatusBadge status="PASS" />);
    expect(screen.getByText('Link OK')).toBeInTheDocument();
  });

  it('shows "Dead Link" for FAIL status', () => {
    renderWithProviders(<LinkStatusBadge status="FAIL" />);
    expect(screen.getByText('Dead Link')).toBeInTheDocument();
  });

  it('shows "Link Warning" for WARN status', () => {
    renderWithProviders(<LinkStatusBadge status="WARN" />);
    expect(screen.getByText('Link Warning')).toBeInTheDocument();
  });

  it('shows "Unchecked" for UNKNOWN status', () => {
    renderWithProviders(<LinkStatusBadge status="UNKNOWN" />);
    expect(screen.getByText('Unchecked')).toBeInTheDocument();
  });

  it('includes link health title attribute', () => {
    renderWithProviders(<LinkStatusBadge status="PASS" />);
    expect(screen.getByTitle('Link health: Link OK')).toBeInTheDocument();
  });
});
