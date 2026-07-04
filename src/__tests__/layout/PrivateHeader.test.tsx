import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PrivateHeader from '../../components/pages/private/layout/PrivateHeader';

const mockUseGetUnreadCountQuery = jest.fn();
const mockUseGetQueueCountQuery = jest.fn();
const mockUseGetMyTicketCountQuery = jest.fn();

jest.mock('../../components/layout/UserMenu', () => ({
  __esModule: true,
  default: ({ user }: { user: { username: string } }) => (
    <div>UserMenu:{user.username}</div>
  )
}));

jest.mock('../../components/admin/ModBar', () => ({
  __esModule: true,
  default: () => <div>ModBar</div>
}));

jest.mock('../../components/layout/QuickSearch', () => ({
  __esModule: true,
  default: () => <div>QuickSearch</div>
}));

jest.mock('../../components/layout/Alert', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  NavLink: ({
    to,
    children,
    className
  }: {
    to: string;
    children:
      | ((arg: { isActive: boolean }) => React.ReactNode)
      | React.ReactNode;
    className?: ((arg: { isActive: boolean }) => string) | string;
  }) => {
    const inactiveClass =
      typeof className === 'function'
        ? className({ isActive: false })
        : (className ?? '');
    const activeClass =
      typeof className === 'function' ? className({ isActive: true }) : '';
    return (
      <a href={to} className={inactiveClass} data-active-class={activeClass}>
        {typeof children === 'function'
          ? children({ isActive: false })
          : children}
      </a>
    );
  }
}));

jest.mock('../../components/staff/staffAffordances', () => ({
  canSeeModBar: (user: {
    permissions?: { staff?: boolean; admin?: boolean };
    userRank?: { permissions?: { staff?: boolean; admin?: boolean } };
  }) =>
    !!(
      user.permissions?.staff ??
      user.permissions?.admin ??
      user.userRank?.permissions?.staff ??
      user.userRank?.permissions?.admin
    ),
  canAccessStaffQueue: (user: {
    permissions?: { staff_inbox_manage?: boolean };
    userRank?: { permissions?: { staff_inbox_manage?: boolean } };
  }) =>
    !!(
      user.permissions?.staff_inbox_manage ??
      user.userRank?.permissions?.staff_inbox_manage
    )
}));

// PrivateHeader fires useGetMyProfileQuery for the donor/warning surface; mock
// it so the test store doesn't issue a real fetch (no jsdom Request → no
// unhandled-rejection / act() noise). These tests assert on the `user` prop, not
// the profile query.
jest.mock('../../store/services/profileApi', () => ({
  useGetMyProfileQuery: () => ({ data: undefined })
}));

jest.mock('../../store/services/messagesApi', () => ({
  useGetUnreadCountQuery: () => mockUseGetUnreadCountQuery()
}));

jest.mock('../../store/services/staffInboxApi', () => ({
  useGetQueueCountQuery: () => mockUseGetQueueCountQuery(),
  useGetMyTicketCountQuery: () => mockUseGetMyTicketCountQuery()
}));

const mockUser = {
  id: 7,
  username: 'testuser',
  avatar: null,
  inviteCount: 2,
  userRank: { level: 100, name: 'Member', color: '#fff', permissions: {} },
  contributed: '2000000000',
  consumed: '500000000',
  ratio: 4.0,
  permissions: {}
};

describe('PrivateHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetUnreadCountQuery.mockReturnValue({ data: { count: 0 } });
    mockUseGetQueueCountQuery.mockReturnValue({ data: { count: 0 } });
    mockUseGetMyTicketCountQuery.mockReturnValue({ data: { count: 0 } });
  });

  it('renders Stellar brand link', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.getByRole('link', { name: /stellar/i })).toHaveAttribute(
      'href',
      '/private/'
    );
  });

  it('renders primary nav links', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(
      screen.getByRole('link', { name: 'Communities' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forums' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Wiki' })).toBeInTheDocument();
  });

  it('shows contributed and consumed stats', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.getByText(/contributed/i)).toBeInTheDocument();
    expect(screen.getByText(/consumed/i)).toBeInTheDocument();
  });

  it('shows ratio as formatted number', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.getByText('4.00')).toBeInTheDocument();
  });

  it('shows ∞ ratio when ratio is null', () => {
    renderWithProviders(
      <PrivateHeader user={{ ...mockUser, ratio: null } as never} />
    );
    expect(screen.getByText('∞')).toBeInTheDocument();
  });

  it('shows Inbox link without badge when no unread messages', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
  });

  it('shows Staff Inbox link for all users', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(
      screen.getByRole('link', { name: /staff inbox/i })
    ).toBeInTheDocument();
  });

  // Staff Inbox is one role-dispatched entry — there is no separate "Staff
  // Queue" link (the queue is what a staffer sees under Staff Inbox).
  it('does not render a separate Staff Queue link, even for staff', () => {
    const staffUser = {
      ...mockUser,
      userRank: {
        ...mockUser.userRank,
        permissions: { staff: true, staff_inbox_manage: true }
      }
    };
    renderWithProviders(<PrivateHeader user={staffUser as never} />);
    expect(
      screen.queryByRole('link', { name: /staff queue/i })
    ).not.toBeInTheDocument();
  });

  it('shows ModBar for staff users', () => {
    const staffUser = {
      ...mockUser,
      userRank: { ...mockUser.userRank, permissions: { staff: true } }
    };
    renderWithProviders(<PrivateHeader user={staffUser as never} />);
    expect(screen.getByText('ModBar')).toBeInTheDocument();
  });

  it('hides ModBar for non-staff users', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.queryByText('ModBar')).not.toBeInTheDocument();
  });

  it('NavLink active state paints from the accent token (data-st contract)', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    const communityLink = screen.getByRole('link', { name: 'Communities' });
    expect(communityLink.getAttribute('data-active-class')).toContain(
      'border-[var(--st-accent)]'
    );
  });

  it('shows inbox unread badge when there are unread messages', () => {
    mockUseGetUnreadCountQuery.mockReturnValue({ data: { count: 4 } });
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('Staff Inbox badge counts the queue for staff (unanswered tickets)', () => {
    const staffUser = {
      ...mockUser,
      userRank: {
        ...mockUser.userRank,
        permissions: { staff: true, staff_inbox_manage: true }
      }
    };
    mockUseGetQueueCountQuery.mockReturnValue({ data: { count: 7 } });
    mockUseGetMyTicketCountQuery.mockReturnValue({ data: { count: 2 } });
    renderWithProviders(<PrivateHeader user={staffUser as never} />);
    // Staff see the queue count, not their own tickets.
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('Staff Inbox badge counts own unread for non-staff members', () => {
    mockUseGetQueueCountQuery.mockReturnValue({ data: { count: 7 } });
    mockUseGetMyTicketCountQuery.mockReturnValue({ data: { count: 3 } });
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    // Members see their own unread, never the staff queue count.
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('shows 0 B for contributed and consumed when user has no data', () => {
    renderWithProviders(
      <PrivateHeader
        user={{ ...mockUser, contributed: null, consumed: null } as never}
      />
    );
    expect(screen.getAllByText('0 B').length).toBeGreaterThan(0);
  });

  it('handles undefined inbox and ticket data without crashing', () => {
    mockUseGetUnreadCountQuery.mockReturnValue({ data: undefined });
    mockUseGetQueueCountQuery.mockReturnValue({ data: undefined });
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
  });
});
