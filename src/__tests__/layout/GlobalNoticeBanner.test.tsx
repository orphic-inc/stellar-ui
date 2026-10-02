import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import GlobalNoticeBanner from '../../components/layout/GlobalNoticeBanner';
import type { Notification } from '../../store/services/notificationApi';

const mockMarkRead = jest.fn();
let mockNotifications: Notification[] | undefined;

jest.mock('../../store/services/notificationApi', () => ({
  useGetNotificationsQuery: () => ({ data: mockNotifications }),
  useMarkNotificationReadMutation: () => [mockMarkRead]
}));

const notice = (over: Partial<Notification> = {}): Notification =>
  ({
    id: 1,
    userId: 1,
    type: 'global_notice',
    actorId: null,
    createdAt: '2024-01-01',
    readAt: null,
    pageId: 0,
    page: 'global_notices',
    postId: null,
    source: { title: 'Scheduled maintenance tonight' },
    actor: null,
    ...over
  }) as Notification;

describe('GlobalNoticeBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifications = [notice()];
    // RTK's trigger returns a promise with .unwrap() (#462).
    mockMarkRead.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
  });

  it('renders nothing when there are no unread global notices', () => {
    mockNotifications = [];
    const { container } = renderWithProviders(<GlobalNoticeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('ignores read notices and non-global types', () => {
    mockNotifications = [
      notice({ id: 2, readAt: '2024-01-02' }),
      notice({ id: 3, type: 'forum_quote' })
    ];
    const { container } = renderWithProviders(<GlobalNoticeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows an unread global notice and dismisses it', () => {
    renderWithProviders(<GlobalNoticeBanner />);
    expect(
      screen.getByText('Scheduled maintenance tonight')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(mockMarkRead).toHaveBeenCalledWith(1);
  });

  it('alerts when dismissing fails', async () => {
    mockMarkRead.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Notice not found.' } })
    });
    const { store } = renderWithProviders(<GlobalNoticeBanner />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => {
      expect(store.getState().alert).toEqual([
        expect.objectContaining({
          alertType: 'danger',
          msg: 'Notice not found.'
        })
      ]);
    });
  });

  it('paints the warning status token (data-st contract)', () => {
    const { container } = renderWithProviders(<GlobalNoticeBanner />);
    const banner = screen
      .getByText('Scheduled maintenance tonight')
      .closest('div');
    expect(banner?.className).toContain('text-[var(--st-warning)]');
    expect(container.firstChild).not.toBeNull();
  });
});
