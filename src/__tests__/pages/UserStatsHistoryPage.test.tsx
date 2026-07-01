import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import UserStatsHistoryPage from '../../components/pages/private/stats/UserStatsHistoryPage';

let mockData: unknown = [];
let mockIsLoading = false;
let mockError: unknown = undefined;

jest.mock('../../store/services/siteApi', () => ({
  useGetUserStatsHistoryQuery: () => ({
    data: mockData,
    isLoading: mockIsLoading,
    error: mockError
  })
}));

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '7' })
}));

describe('UserStatsHistoryPage', () => {
  beforeEach(() => {
    mockData = [];
    mockIsLoading = false;
    mockError = undefined;
  });

  it('shows the empty state when there are no snapshots', () => {
    renderWithProviders(<UserStatsHistoryPage />);
    expect(
      screen.getByText(/no snapshots for this period yet/i)
    ).toBeInTheDocument();
  });

  it('shows the private notice on a 403', () => {
    mockData = undefined;
    mockError = { status: 403 };
    renderWithProviders(<UserStatsHistoryPage />);
    expect(screen.getByText(/stats are private/i)).toBeInTheDocument();
  });

  it('emits the data-st theming hooks', () => {
    const { container } = renderWithProviders(<UserStatsHistoryPage />);
    expect(container.querySelector('[data-st="panel"]')).toBeTruthy();
    expect(
      container.querySelector('[data-st="prose"][data-st-strong]')
    ).toBeTruthy();
  });
});
