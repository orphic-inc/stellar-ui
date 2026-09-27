import { render, screen, within } from '@testing-library/react';
import PercentileRankings from '../../components/profile/PercentileRankings';
import type { components } from '../../types/api';

type Percentiles = components['schemas']['ProfilePercentiles'];

const tile = (percentile: number, rank: number, raw: number) => ({
  percentile,
  rank,
  total: 25,
  raw
});

const ALL_VISIBLE: Percentiles = {
  contributed: tile(80, 5, 1_300_000_000),
  consumed: tile(60, 10, 2048),
  contributions: tile(70, 7, 1234),
  requestsFilled: tile(40, 15, 4),
  bountySpent: tile(55, 11, 1024),
  forumPosts: tile(50, 12, 30),
  artistsAdded: tile(30, 17, 9),
  overall: 62
};

const tileFor = (label: string) => {
  const heading = screen.getByText(label);
  return heading.parentElement as HTMLElement;
};

describe('PercentileRankings (#165)', () => {
  it('shows the value behind each percentile on the meta line', () => {
    render(<PercentileRankings percentiles={ALL_VISIBLE} />);

    expect(
      within(tileFor('Contributed')).getByText('80th percentile')
    ).toBeInTheDocument();
    // Byte dimensions use the byte formatter…
    expect(
      within(tileFor('Contributed')).getByText('#5 of 25 · 1.21 GB')
    ).toBeInTheDocument();
    expect(
      within(tileFor('Bounty Spent')).getByText('#11 of 25 · 1.00 KB')
    ).toBeInTheDocument();
    // …counts use thousands separators.
    expect(
      within(tileFor('Contributions')).getByText(
        `#7 of 25 · ${(1234).toLocaleString()}`
      )
    ).toBeInTheDocument();
    expect(
      within(tileFor('Artists Added')).getByText('#17 of 25 · 9')
    ).toBeInTheDocument();
  });

  it('orders the tiles as legacy did, Overall last', () => {
    render(<PercentileRankings percentiles={ALL_VISIBLE} />);

    const labels = [
      'Contributed',
      'Consumed',
      'Contributions',
      'Requests Filled',
      'Bounty Spent',
      'Forum Posts',
      'Artists Added',
      'Overall'
    ];
    const positions = labels.map((label) =>
      document.body.innerHTML.indexOf(`>${label}<`)
    );
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('shows Overall as a bare weighted score, not a percentile', () => {
    render(<PercentileRankings percentiles={ALL_VISIBLE} />);

    const overall = tileFor('Overall');
    expect(within(overall).getByText('62')).toBeInTheDocument();
    expect(
      within(overall).getByText('Weighted score · ratio-adjusted')
    ).toBeInTheDocument();
    expect(within(overall).queryByText(/percentile/)).not.toBeInTheDocument();
  });

  it('leaves out every tile the member has hidden, Overall included', () => {
    render(
      <PercentileRankings
        percentiles={{
          ...ALL_VISIBLE,
          consumed: null,
          bountySpent: null,
          overall: null
        }}
      />
    );

    expect(screen.queryByText('Consumed')).not.toBeInTheDocument();
    expect(screen.queryByText('Bounty Spent')).not.toBeInTheDocument();
    expect(screen.queryByText('Overall')).not.toBeInTheDocument();
    expect(screen.getByText('Contributed')).toBeInTheDocument();
    expect(screen.getByText('Artists Added')).toBeInTheDocument();
  });

  it('shows an Overall of 0 rather than treating it as hidden', () => {
    render(<PercentileRankings percentiles={{ ...ALL_VISIBLE, overall: 0 }} />);

    expect(within(tileFor('Overall')).getByText('0')).toBeInTheDocument();
  });
});
