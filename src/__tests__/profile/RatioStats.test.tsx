import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RatioStats from '../../components/profile/RatioStats';

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const baseStats: {
  contributed: number;
  consumed: number;
  ratio: number;
  requiredRatio: number;
  meetsRequirement: boolean;
  bracket: { label: string };
  contributionCoverage: number;
  eligibleContributionBytes: number;
  policy: { status: string } | null;
} = {
  contributed: 2000000000,
  consumed: 500000000,
  ratio: 4.0,
  requiredRatio: 0.6,
  meetsRequirement: true,
  bracket: { label: '2–5 GB' },
  contributionCoverage: 1.5,
  eligibleContributionBytes: 1000000000,
  policy: null
};

let mockStatsData: typeof baseStats | null = baseStats;
let mockIsLoading = false;

jest.mock('../../store/services/profileApi', () => ({
  useGetMyRatioStatsQuery: () => ({
    data: mockStatsData,
    isLoading: mockIsLoading
  })
}));

describe('RatioStats', () => {
  beforeEach(() => {
    mockStatsData = baseStats;
    mockIsLoading = false;
  });

  it('shows spinner when loading', () => {
    mockIsLoading = true;
    mockStatsData = null;
    renderWithProviders(<RatioStats />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders nothing when stats are null', () => {
    mockStatsData = null;
    const { container } = renderWithProviders(<RatioStats />);
    expect(container.firstChild).toBeNull();
  });

  it('shows uploaded and downloaded values', () => {
    renderWithProviders(<RatioStats />);
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText('Downloaded')).toBeInTheDocument();
  });

  it('shows ratio value', () => {
    renderWithProviders(<RatioStats />);
    expect(screen.getByText(/4\.000/)).toBeInTheDocument();
  });

  it('applies success token color when ratio meets requirement', () => {
    renderWithProviders(<RatioStats />);
    const ratioEl = screen.getByText(/4\.000/);
    expect(ratioEl.className).toContain('text-[var(--st-success)]');
  });

  it('applies danger token color when ratio does not meet requirement', () => {
    mockStatsData = { ...baseStats, meetsRequirement: false };
    renderWithProviders(<RatioStats />);
    const ratioEl = screen.getByText(/4\.000/);
    expect(ratioEl.className).toContain('text-[var(--st-danger)]');
  });

  it('shows LEECH_DISABLED warning', () => {
    mockStatsData = { ...baseStats, policy: { status: 'LEECH_DISABLED' } };
    renderWithProviders(<RatioStats />);
    expect(screen.getByText(/downloads disabled/i)).toBeInTheDocument();
  });

  it('shows WATCH warning', () => {
    mockStatsData = { ...baseStats, policy: { status: 'WATCH' } };
    renderWithProviders(<RatioStats />);
    expect(screen.getByText(/ratio watch active/i)).toBeInTheDocument();
  });

  it('shows ratio rules link', () => {
    renderWithProviders(<RatioStats />);
    expect(
      screen.getByRole('link', { name: /ratio rules/i })
    ).toBeInTheDocument();
  });

  it('paints from the data-st panel/colhead/meta contract', () => {
    const { container } = renderWithProviders(<RatioStats />);
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="colhead"]')).toBeInTheDocument();
    expect(container.querySelector('li[data-st="meta"]')).toBeInTheDocument();
    // The strong stat values decompose to prose -strong. (The footer Link is a
    // `control`, but this suite's Link mock strips extra props, so assert prose.)
    expect(
      container.querySelector('[data-st="prose"][data-st-strong]')
    ).toBeInTheDocument();
  });
});
