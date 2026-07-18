import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import CommunitiesTable from '../../components/communities/CommunitiesTable';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const mockCommunities = [
  {
    id: 1,
    name: 'Jazz Archive',
    description: 'A collection of jazz recordings',
    type: 'Music',
    allowDuplicateFormats: false,
    _count: { releases: 120, contributors: 15, consumers: 80 }
  },
  {
    id: 2,
    name: 'Film Noir',
    description: null,
    type: null,
    allowDuplicateFormats: false,
    _count: { releases: 45, contributors: 8, consumers: 30 }
  }
];

describe('CommunitiesTable', () => {
  it('shows empty state when no communities', () => {
    renderWithProviders(<CommunitiesTable communities={[]} />);
    expect(screen.getByText('No communities to display.')).toBeInTheDocument();
  });

  it('renders community names as links', () => {
    renderWithProviders(<CommunitiesTable communities={mockCommunities} />);
    expect(screen.getByRole('link', { name: 'Jazz Archive' })).toHaveAttribute(
      'href',
      '/communities/1'
    );
    expect(screen.getByRole('link', { name: 'Film Noir' })).toBeInTheDocument();
  });

  it('shows description when present', () => {
    renderWithProviders(<CommunitiesTable communities={mockCommunities} />);
    expect(
      screen.getByText('A collection of jazz recordings')
    ).toBeInTheDocument();
  });

  it('shows type or dash when null', () => {
    renderWithProviders(<CommunitiesTable communities={mockCommunities} />);
    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows release and contributor counts', () => {
    renderWithProviders(<CommunitiesTable communities={mockCommunities} />);
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('carries the data-st theming hooks (grid table + type chip)', () => {
    renderWithProviders(<CommunitiesTable communities={mockCommunities} />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    // The Badge paints the community type from the chip Role.
    expect(screen.getByText('Music')).toHaveAttribute('data-st', 'chip');
  });
});
