import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import SiteInfoPage from '../../components/staff/SiteInfoPage';

const mockUseGetSiteInfoQuery = jest.fn();

jest.mock('../../store/services/adminApi', () => ({
  useGetSiteInfoQuery: () => mockUseGetSiteInfoQuery()
}));

describe('SiteInfoPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a spinner while loading', () => {
    mockUseGetSiteInfoQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<SiteInfoPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders stat tiles on kit panels', () => {
    mockUseGetSiteInfoQuery.mockReturnValue({
      data: { totalUsers: 1234, releases: 56 },
      isLoading: false
    });
    renderWithProviders(<SiteInfoPage />);
    expect(
      document.querySelectorAll('[data-st="panel"]').length
    ).toBeGreaterThan(0);
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    // A key with no data renders the em dash.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
