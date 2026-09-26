import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NotificationCorner from '../../components/layout/NotificationCorner';

// Unread filter matches in the corner (#370). The corner's own notifications
// are covered in NotificationCorner.test.tsx; here they are empty.
let mockHitCount = 0;
let mockUnreadCount = 0;
const mockHitCountQuery = jest.fn();

jest.mock('../../store/services/notificationFilterApi', () => ({
  useGetNotificationFilterHitUnreadCountQuery: (
    _arg: undefined,
    options: { skip: boolean }
  ) => {
    mockHitCountQuery(options);
    return { data: options.skip ? undefined : { count: mockHitCount } };
  }
}));

jest.mock('../../store/services/notificationApi', () => ({
  useGetNotificationsQuery: () => ({ data: [] }),
  useGetUnreadNotificationCountQuery: () => ({
    data: { count: mockUnreadCount }
  }),
  useMarkNotificationReadMutation: () => [jest.fn()],
  useMarkAllNotificationsReadMutation: () => [jest.fn()],
  useDeleteNotificationMutation: () => [jest.fn()]
}));

jest.mock('../../store/services/messagesApi', () => ({
  useGetUnreadCountQuery: () => ({ data: { count: 0 } })
}));

describe('NotificationCorner — filter matches (#370)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHitCount = 0;
    mockUnreadCount = 0;
  });

  it('does not ask for them unless the rank allows filters', () => {
    renderWithProviders(<NotificationCorner />);
    expect(mockHitCountQuery).toHaveBeenCalledWith({ skip: true });
  });

  it('adds unread matches to the badge and links to them', async () => {
    mockUnreadCount = 2;
    mockHitCount = 3;
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner showFilterHits />);
    expect(screen.getByText('5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(
      screen.getByRole('link', { name: /3 new filter matches/i })
    ).toHaveAttribute('href', '/notification-filters/hits');
  });

  it('shows the corner for matches alone', () => {
    mockHitCount = 1;
    renderWithProviders(<NotificationCorner showFilterHits />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
