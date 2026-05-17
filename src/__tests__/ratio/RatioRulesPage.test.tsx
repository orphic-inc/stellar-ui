import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RatioRulesPage from '../../components/profile/RatioRulesPage';

const mockUseGetMyRatioStatsQuery = jest.fn();

jest.mock('../../store/services/profileApi', () => ({
  useGetMyRatioStatsQuery: () => mockUseGetMyRatioStatsQuery()
}));

describe('RatioRulesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders current ratio stats and highlights the active bracket', () => {
    mockUseGetMyRatioStatsQuery.mockReturnValue({
      data: {
        ratio: 0.42,
        requiredRatio: 0.3,
        totalEarned: '10737418240',
        consumed: '26843545600',
        eligibleContributionBytes: '5368709120',
        contributionCoverage: 0.5,
        meetsRequirement: true,
        bracket: { label: '20–30 GiB', maxRequired: 0.3, minRequired: 0.05 },
        policy: {
          status: 'WATCH',
          watchStartedAt: '2026-05-17T12:00:00.000Z',
          watchExpiresAt: '2026-05-31T12:00:00.000Z',
          leechDisabledAt: null,
          lastEvaluatedAt: '2026-05-17T18:00:00.000Z'
        }
      }
    });

    renderWithProviders(<RatioRulesPage />);

    expect(screen.getByText('0.420')).toBeInTheDocument();
    expect(screen.getByText('0.300')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('← your bracket')).toBeInTheDocument();
  });

  it('renders the static guidance even without stats', () => {
    mockUseGetMyRatioStatsQuery.mockReturnValue({ data: undefined });

    renderWithProviders(<RatioRulesPage />);

    expect(screen.getByText('Ratio Rules')).toBeInTheDocument();
    expect(
      screen.getByText(/5 GiB of free upload credit/i)
    ).toBeInTheDocument();
  });
});
