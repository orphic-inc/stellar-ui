import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import SiteStatsHistoryPage from '../../components/pages/private/stats/SiteStatsHistoryPage';

let mockData: unknown = [];
let mockIsLoading = false;
let mockError: unknown = undefined;

jest.mock('../../store/services/siteApi', () => ({
  useGetSiteStatsHistoryQuery: () => ({
    data: mockData,
    isLoading: mockIsLoading,
    error: mockError
  })
}));

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

describe('SiteStatsHistoryPage', () => {
  beforeEach(() => {
    mockData = [];
    mockIsLoading = false;
    mockError = undefined;
  });

  it('shows the empty state when there are no snapshots', () => {
    renderWithProviders(<SiteStatsHistoryPage />);
    expect(
      screen.getByText(/no historical snapshots yet/i)
    ).toBeInTheDocument();
  });

  it('shows an error banner on failure', () => {
    mockData = undefined;
    mockError = { status: 500 };
    renderWithProviders(<SiteStatsHistoryPage />);
    expect(
      screen.getByText(/failed to load site stats history/i)
    ).toBeInTheDocument();
  });

  it('emits the data-st theming hooks', () => {
    const { container } = renderWithProviders(<SiteStatsHistoryPage />);
    expect(container.querySelector('[data-st="panel"]')).toBeTruthy();
    expect(
      container.querySelector('[data-st="prose"][data-st-strong]')
    ).toBeTruthy();
  });
});
