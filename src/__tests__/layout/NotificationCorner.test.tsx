import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NotificationCorner from '../../components/layout/NotificationCorner';

const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockDeleteNotification = jest.fn();

const mockNotifications = [
  {
    id: 1,
    readAt: null,
    pageId: 10,
    page: 'forums',
    postId: 5,
    source: { forumId: 2, title: 'Jazz Talk' },
    quoter: { username: 'alice' }
  },
  {
    id: 2,
    readAt: '2024-01-01',
    pageId: 20,
    page: 'artist',
    source: { title: 'Miles Davis' },
    quoter: { username: 'bob' }
  }
];

let mockNotificationsData: typeof mockNotifications | undefined =
  mockNotifications;
let mockUnreadCount = 2;
let mockPmCount = 0;

jest.mock('../../store/services/notificationApi', () => ({
  useGetNotificationsQuery: () => ({ data: mockNotificationsData }),
  useGetUnreadNotificationCountQuery: () => ({
    data: { count: mockUnreadCount }
  }),
  useMarkNotificationReadMutation: () => [mockMarkRead],
  useMarkAllNotificationsReadMutation: () => [mockMarkAllRead],
  useDeleteNotificationMutation: () => [mockDeleteNotification]
}));

jest.mock('../../store/services/messagesApi', () => ({
  useGetUnreadCountQuery: () => ({ data: { count: mockPmCount } })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({
    to,
    children,
    onClick
  }: {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  )
}));

describe('NotificationCorner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationsData = mockNotifications;
    mockUnreadCount = 2;
    mockPmCount = 0;
  });

  it('returns null when total count is zero', () => {
    mockUnreadCount = 0;
    mockPmCount = 0;
    const { container } = renderWithProviders(<NotificationCorner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows count badge with total when notifications exist', () => {
    renderWithProviders(<NotificationCorner />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows combined count of PM + notifications', () => {
    mockPmCount = 3;
    mockUnreadCount = 2;
    renderWithProviders(<NotificationCorner />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('toggles panel open on bell button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows PM link in panel when pmCount > 0', async () => {
    const user = userEvent.setup();
    mockPmCount = 2;
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText(/2 unread messages/i)).toBeInTheDocument();
  });

  it('shows Mark all read button when unread notifications exist', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(
      screen.getByRole('button', { name: /mark all read/i })
    ).toBeInTheDocument();
  });

  it('calls markAllRead when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    await user.click(screen.getByRole('button', { name: /mark all read/i }));
    expect(mockMarkAllRead).toHaveBeenCalled();
  });

  it('renders notification source link and quoter reference', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByRole('link', { name: 'Jazz Talk' })).toBeInTheDocument();
    expect(screen.getByText(/alice quoted you in/i)).toBeInTheDocument();
  });

  it('calls markRead when clicking an unread notification link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    await user.click(screen.getByRole('link', { name: 'Jazz Talk' }));
    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith(1);
    });
  });

  it('calls deleteNotification when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    await user.click(dismissButtons[0]);
    expect(mockDeleteNotification).toHaveBeenCalledWith(1);
  });

  it('closes panel when close (✕) button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    const closeBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent === '✕' && !b.getAttribute('aria-label'));
    await user.click(closeBtn!);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });
});
