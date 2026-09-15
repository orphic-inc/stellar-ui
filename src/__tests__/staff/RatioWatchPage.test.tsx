import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RatioWatchPage from '../../components/staff/RatioWatchPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetRatioWatchQuery: () => mockQuery()
}));

const makeRow = (
  status: string,
  disabledCause: 'RATIO' | 'STAFF' | null = null
) => ({
  userId: 3,
  user: { id: 3, username: 'overconsumer' },
  status,
  disabledCause,
  watchStartedAt: '2026-01-02T00:00:00.000Z',
  watchExpiresAt: null,
  downloadDisabledAt: null,
  lastEvaluatedAt: '2026-01-03T00:00:00.000Z'
});

describe('RatioWatchPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<RatioWatchPage />);
    expect(screen.getByText('No users on ratio watch.')).toBeInTheDocument();
  });

  it('labels a download-disabled user', () => {
    mockQuery.mockReturnValue({
      data: { data: [makeRow('DOWNLOAD_DISABLED')], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<RatioWatchPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    // "Download Disabled" is also a column header; target the status cell span.
    expect(
      screen.getByText('Download Disabled', { selector: 'span' })
    ).toBeInTheDocument();
  });

  it('labels a watched user', () => {
    mockQuery.mockReturnValue({
      data: { data: [makeRow('WATCH')], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<RatioWatchPage />);
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });
  it.each([
    ['RATIO', 'Download Disabled · Ratio', null],
    ['STAFF', 'Download Disabled · Staff', 'Only staff can lift this']
  ] as const)(
    'names the cause of a %s disable in the status cell',
    (cause, label, title) => {
      mockQuery.mockReturnValue({
        data: {
          data: [makeRow('DOWNLOAD_DISABLED', cause)],
          meta: { totalPages: 1 }
        },
        isLoading: false
      });
      renderWithProviders(<RatioWatchPage />);
      const cell = screen.getByText(label, { selector: 'span' });
      if (title) expect(cell).toHaveAttribute('title', title);
      else expect(cell).not.toHaveAttribute('title');
    }
  );
});
