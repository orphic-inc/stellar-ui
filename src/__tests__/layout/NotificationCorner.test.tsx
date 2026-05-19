import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NotificationCorner from '../../components/layout/NotificationCorner';
import type { Notification } from '../../store/services/notificationApi';

const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockDeleteNotification = jest.fn();

const mockNotifications: Notification[] = [
  {
    id: 1,
    userId: 1,
    quoterId: 10,
    createdAt: '2024-01-01',
    readAt: null,
    pageId: 10,
    page: 'forums',
    postId: 5,
    source: { forumId: 2, title: 'Jazz Talk' },
    quoter: { id: 10, username: 'alice', avatar: null }
  },
  {
    id: 2,
    userId: 1,
    quoterId: 11,
    createdAt: '2024-01-02',
    readAt: '2024-01-01',
    pageId: 20,
    page: 'artist',
    postId: null,
    source: { title: 'Miles Davis' },
    quoter: { id: 11, username: 'bob', avatar: null }
  }
];

let mockNotificationsData: typeof mockNotifications | undefined =
  mockNotifications;
let mockUnreadCount: number | undefined = 2;
let mockPmCount: number | undefined = 0;

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

  it('covers collages, requests, communities, default, and null-source page types', async () => {
    mockNotificationsData = [
      {
        id: 3,
        userId: 1,
        quoterId: 12,
        createdAt: '2024-01-03',
        readAt: null,
        pageId: 30,
        page: 'collages',
        postId: null,
        source: { title: 'Cool Collage' },
        quoter: { id: 12, username: 'carol', avatar: null }
      },
      {
        id: 4,
        userId: 1,
        quoterId: 13,
        createdAt: '2024-01-04',
        readAt: null,
        pageId: 40,
        page: 'requests',
        postId: null,
        source: { title: 'A Request' },
        quoter: { id: 13, username: 'dave', avatar: null }
      },
      {
        id: 5,
        userId: 1,
        quoterId: 14,
        createdAt: '2024-01-05',
        readAt: null,
        pageId: 50,
        page: 'communities',
        postId: null,
        source: { title: 'Jazz Heads' },
        quoter: { id: 14, username: 'eve', avatar: null }
      },
      {
        id: 6,
        userId: 1,
        quoterId: 15,
        createdAt: '2024-01-06',
        readAt: null,
        pageId: 60,
        page: 'unknown',
        postId: null,
        source: { title: 'Who Knows' },
        quoter: { id: 15, username: 'frank', avatar: null }
      },
      {
        id: 7,
        userId: 1,
        quoterId: 16,
        createdAt: '2024-01-07',
        readAt: null,
        pageId: 70,
        page: 'forums',
        postId: null,
        source: null,
        quoter: { id: 16, username: 'grace', avatar: null }
      }
    ];
    mockUnreadCount = 5;

    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByRole('link', { name: 'Cool Collage' })).toHaveAttribute(
      'href',
      '/private/collages/30'
    );
    expect(screen.getByRole('link', { name: 'A Request' })).toHaveAttribute(
      'href',
      '/private/requests/40'
    );
    expect(screen.getByRole('link', { name: 'Jazz Heads' })).toHaveAttribute(
      'href',
      '/private/communities/50'
    );
    expect(screen.getByText(/unknown #60/i)).toBeInTheDocument();
    expect(screen.getByText(/forums #70/i)).toBeInTheDocument();
  });

  it('clicking PM link closes the panel', async () => {
    mockPmCount = 1;
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /1 unread message/i }));
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('closes panel on mousedown outside', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('shows 99+ when total count exceeds 99', () => {
    mockPmCount = 60;
    mockUnreadCount = 60;
    renderWithProviders(<NotificationCorner />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('uses 0 fallback when pmData count is undefined', () => {
    mockPmCount = undefined;
    mockUnreadCount = 3;
    renderWithProviders(<NotificationCorner />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('uses 0 fallback when unreadNotifData count is undefined, renders via pmCount', () => {
    mockUnreadCount = undefined;
    mockPmCount = 4;
    renderWithProviders(<NotificationCorner />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows only PM link and no notification list when pmCount > 0 and notifCount = 0', async () => {
    const user = userEvent.setup();
    mockNotificationsData = [];
    mockUnreadCount = 0;
    mockPmCount = 2;
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText(/2 unread messages/i)).toBeInTheDocument();
    expect(screen.queryByText('No notifications')).not.toBeInTheDocument();
  });

  it('shows "No notifications" when notifications is undefined but unread count > 0', async () => {
    const user = userEvent.setup();
    mockNotificationsData = undefined;
    mockUnreadCount = 1;
    mockPmCount = 0;
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('does not call markRead when clicking a read notification link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCorner />);
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    await user.click(screen.getByRole('link', { name: 'Miles Davis' }));
    expect(mockMarkRead).not.toHaveBeenCalled();
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
