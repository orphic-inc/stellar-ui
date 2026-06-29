import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ReleaseStatsPage from '../../components/staff/ReleaseStatsPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetReleaseStatsQuery: () => mockQuery()
}));

const data = {
  releases: 1200,
  contributions: 340,
  artists: 88,
  byType: [{ type: 'Album', _count: 900 }],
  byLinkStatus: [{ linkStatus: 'Linked', _count: 1100 }]
};

describe('ReleaseStatsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the headline stat cards', () => {
    mockQuery.mockReturnValue({ data, isLoading: false });
    renderWithProviders(<ReleaseStatsPage />);
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('Releases')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
  });

  it('renders the breakdown tables', () => {
    mockQuery.mockReturnValue({ data, isLoading: false });
    renderWithProviders(<ReleaseStatsPage />);
    expect(screen.getByText('By Type')).toBeInTheDocument();
    expect(screen.getByText('By Link Status')).toBeInTheDocument();
    expect(document.querySelectorAll('table[data-st="grid"]')).toHaveLength(2);
    expect(screen.getByText('Album')).toBeInTheDocument();
  });
});
