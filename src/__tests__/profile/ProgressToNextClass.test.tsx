import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ProgressToNextClass from '../../components/profile/ProgressToNextClass';

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

type Gap = {
  toRankName: string | null;
  contributedShortBytes: string;
  ratioShort: number;
  contributionsShort: number;
  ageShortDays: number;
  extraUnmet: 'DISTINCT_RELEASES_500' | 'QUALITY_CONTRIB_500' | null;
};

type Progression = {
  currentRankId: number;
  currentRankName: string | null;
  rankLocked: boolean;
  gap: Gap | null;
};

const midLadder: Progression = {
  currentRankId: 1,
  currentRankName: 'User',
  rankLocked: false,
  gap: {
    toRankName: 'Member',
    contributedShortBytes: String(5 * 1024 * 1024 * 1024),
    ratioShort: 0.2,
    contributionsShort: 3,
    ageShortDays: 4,
    extraUnmet: null
  }
};

let mockData: Progression | null = midLadder;
let mockIsLoading = false;

jest.mock('../../store/services/profileApi', () => ({
  useGetMyProgressionQuery: () => ({
    data: mockData,
    isLoading: mockIsLoading
  })
}));

describe('ProgressToNextClass', () => {
  beforeEach(() => {
    mockData = midLadder;
    mockIsLoading = false;
  });

  it('names the next class for a mid-ladder member', () => {
    renderWithProviders(<ProgressToNextClass />);
    expect(screen.getByText(/Member/)).toBeInTheDocument();
  });

  it('shows the per-criterion shortfalls', () => {
    renderWithProviders(<ProgressToNextClass />);
    expect(screen.getByText(/5\.00 GB/)).toBeInTheDocument(); // bytes short
    expect(screen.getByText(/0\.2/)).toBeInTheDocument(); // ratio short
    expect(screen.getByText(/3/)).toBeInTheDocument(); // contributions short
    expect(screen.getByText(/4/)).toBeInTheDocument(); // age short days
  });

  it('omits criteria already satisfied (zero shortfall)', () => {
    mockData = {
      ...midLadder,
      gap: {
        toRankName: 'Member',
        contributedShortBytes: '0',
        ratioShort: 0,
        contributionsShort: 0,
        ageShortDays: 0,
        extraUnmet: 'QUALITY_CONTRIB_500'
      }
    };
    renderWithProviders(<ProgressToNextClass />);
    expect(screen.queryByText(/upload more/i)).not.toBeInTheDocument();
    expect(screen.getByText(/quality/i)).toBeInTheDocument();
  });

  it('renders a max-class state at the top of the ladder', () => {
    mockData = { ...midLadder, currentRankName: 'Stellarige', gap: null };
    renderWithProviders(<ProgressToNextClass />);
    expect(
      screen.getByText(/highest class|max class|top of/i)
    ).toBeInTheDocument();
  });

  it('renders nothing when there is no data', () => {
    mockData = null;
    const { container } = renderWithProviders(<ProgressToNextClass />);
    expect(container.firstChild).toBeNull();
  });

  it('shows a spinner while loading', () => {
    mockData = null;
    mockIsLoading = true;
    renderWithProviders(<ProgressToNextClass />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
