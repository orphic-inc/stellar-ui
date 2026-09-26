import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NotificationFilterHitsPage from '../../components/notificationFilters/NotificationFilterHitsPage';
import type { NotificationFilterHit } from '../../store/services/notificationFilterApi';

const mockGetHits = jest.fn();
const mockMarkRead = jest.fn();
const mockRemove = jest.fn();
const mockCatchUp = jest.fn();
const mockClearRead = jest.fn();

jest.mock('../../store/services/notificationFilterApi', () => ({
  useGetNotificationFiltersQuery: () => ({
    data: {
      filters: [
        { id: 12, label: 'Dubstep' },
        { id: 13, label: 'Lossless jazz' }
      ],
      limit: null
    }
  }),
  useGetNotificationFilterHitsQuery: (arg: unknown) => mockGetHits(arg),
  useMarkNotificationFilterHitReadMutation: () => [mockMarkRead],
  useRemoveNotificationFilterHitMutation: () => [mockRemove],
  useCatchUpNotificationFilterHitsMutation: () => [
    mockCatchUp,
    { isLoading: false }
  ],
  useClearReadNotificationFilterHitsMutation: () => [
    mockClearRead,
    { isLoading: false }
  ]
}));

const makeHit = (
  contributionId: number,
  over: Partial<NotificationFilterHit> = {}
): NotificationFilterHit => ({
  contributionId,
  read: false,
  matchedAt: '2026-09-20T12:00:00.000Z',
  filters: [
    { id: 12, label: 'Dubstep' },
    { id: 13, label: 'Lossless jazz' }
  ],
  contribution: {
    id: contributionId,
    type: 'flac',
    bitrate: 'Lossless',
    createdAt: '2026-09-20T12:00:00.000Z',
    uploader: { id: 3, username: 'carol' },
    release: { id: 70, title: 'Untrue', year: 2007, communityId: 1 }
  },
  ...over
});

const withHits = (hits: NotificationFilterHit[]) =>
  mockGetHits.mockReturnValue({
    data: {
      data: hits,
      meta: { total: hits.length, page: 1, limit: 25, totalPages: 1 }
    },
    isLoading: false,
    error: undefined
  });

const renderAt = (path: string) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/notification-filters/hits"
        element={<NotificationFilterHitsPage />}
      />
      <Route
        path="/notification-filters/:filterId/hits"
        element={<NotificationFilterHitsPage />}
      />
    </Routes>,
    { initialEntries: [path] }
  );

const resolved = () => ({ unwrap: () => Promise.resolve() });

describe('NotificationFilterHitsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemove.mockReturnValue(resolved());
    mockCatchUp.mockReturnValue(resolved());
    mockClearRead.mockReturnValue(resolved());
  });

  it('marks nothing read just by loading', () => {
    withHits([makeHit(50), makeHit(51)]);
    const { container } = renderAt('/notification-filters/hits');

    expect(screen.getAllByRole('link', { name: 'Untrue (2007)' })).toHaveLength(
      2
    );
    expect(
      container.querySelector('li[data-st="row"][data-st-open]')
    ).toBeTruthy();
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  describe('combined view', () => {
    it('asks for every filter and names the filters that matched', () => {
      withHits([makeHit(50)]);
      renderAt('/notification-filters/hits');

      expect(mockGetHits).toHaveBeenCalledWith({
        page: 1,
        filterId: undefined
      });
      expect(screen.getByText(/Matched by/)).toBeInTheDocument();
    });

    it("opening a hit reads every filter's row for it", async () => {
      withHits([makeHit(50)]);
      const user = userEvent.setup();
      renderAt('/notification-filters/hits');

      await user.click(screen.getByRole('link', { name: 'Untrue (2007)' }));
      expect(mockMarkRead).toHaveBeenCalledWith({
        contributionId: 50,
        filterId: undefined
      });
    });

    it('catches up and clears read across every filter', async () => {
      withHits([makeHit(50)]);
      const user = userEvent.setup();
      renderAt('/notification-filters/hits');

      await user.click(screen.getByRole('button', { name: 'Catch up' }));
      await user.click(screen.getByRole('button', { name: 'Clear read' }));
      expect(mockCatchUp).toHaveBeenCalledWith({ filterId: undefined });
      expect(mockClearRead).toHaveBeenCalledWith({ filterId: undefined });
    });
  });

  describe("one filter's view", () => {
    it('asks for that filter and passes it to every write', async () => {
      withHits([makeHit(50)]);
      const user = userEvent.setup();
      renderAt('/notification-filters/12/hits');

      expect(mockGetHits).toHaveBeenCalledWith({ page: 1, filterId: 12 });
      expect(screen.queryByText(/Matched by/)).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Catch up' }));
      await user.click(screen.getByRole('button', { name: 'Clear read' }));
      await user.click(
        screen.getByRole('button', { name: 'Remove Untrue (2007)' })
      );
      expect(mockCatchUp).toHaveBeenCalledWith({ filterId: 12 });
      expect(mockClearRead).toHaveBeenCalledWith({ filterId: 12 });
      expect(mockRemove).toHaveBeenCalledWith({
        contributionId: 50,
        filterId: 12
      });

      await user.click(screen.getByRole('link', { name: 'Untrue (2007)' }));
      expect(mockMarkRead).toHaveBeenCalledWith({
        contributionId: 50,
        filterId: 12
      });
    });
  });

  it('does not re-read a hit that is already read', async () => {
    withHits([makeHit(50, { read: true })]);
    const user = userEvent.setup();
    renderAt('/notification-filters/hits');

    await user.click(screen.getByRole('link', { name: 'Untrue (2007)' }));
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('shows a release with no community as text, not a dead link', () => {
    const hit = makeHit(50);
    hit.contribution.release.communityId = null;
    withHits([hit]);
    renderAt('/notification-filters/hits');

    expect(screen.getByText('Untrue (2007)')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Untrue (2007)' })
    ).not.toBeInTheDocument();
  });

  it('reports a failed write', async () => {
    withHits([makeHit(50)]);
    mockCatchUp.mockReturnValue({
      unwrap: () => Promise.reject({ status: 500, data: {} })
    });
    const user = userEvent.setup();
    const { store } = renderAt('/notification-filters/hits');

    await user.click(screen.getByRole('button', { name: 'Catch up' }));
    await waitFor(() =>
      expect(store.getState().alert[0]).toMatchObject({
        msg: 'Failed to catch up.',
        alertType: 'danger'
      })
    );
  });

  it('lists every filter as a view', () => {
    withHits([]);
    renderAt('/notification-filters/hits');

    const nav = screen.getByRole('navigation', { name: 'Filters' });
    expect(nav).toHaveTextContent('All filters');
    expect(nav).toHaveTextContent('Dubstep');
    expect(nav).toHaveTextContent('Lossless jazz');
    expect(screen.getByText('Nothing matched yet.')).toBeInTheDocument();
  });
});
