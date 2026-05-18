import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PrivateHeader from '../../components/pages/private/layout/PrivateHeader';

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
    children
  }: {
    to: string;
    children:
      | ((arg: { isActive: boolean }) => React.ReactNode)
      | React.ReactNode;
  }) => (
    <a href={to}>
      {typeof children === 'function'
        ? children({ isActive: false })
        : children}
    </a>
  )
}));

jest.mock('../../utils/permissions', () => ({
  isStaffUser: (user: { permissions?: { staff?: boolean } }) =>
    !!user.permissions?.staff
}));

jest.mock('../../store/services/messagesApi', () => ({
  useGetUnreadCountQuery: () => ({ data: { count: 0 } })
}));

jest.mock('../../store/services/staffInboxApi', () => ({
  useGetQueueCountQuery: () => ({ data: { count: 0 } })
}));

const mockUser = {
  id: 7,
  username: 'testuser',
  avatar: null,
  inviteCount: 2,
  userRank: { level: 100, name: 'Member', color: '#fff' },
  contributed: '2000000000',
  consumed: '500000000',
  ratio: 4.0,
  permissions: {}
};

describe('PrivateHeader', () => {
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

  it('hides Staff Inbox link for non-staff users', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(
      screen.queryByRole('link', { name: /staff inbox/i })
    ).not.toBeInTheDocument();
  });

  it('shows Staff Inbox link for staff users', () => {
    const staffUser = { ...mockUser, permissions: { staff: true } };
    renderWithProviders(<PrivateHeader user={staffUser as never} />);
    expect(
      screen.getByRole('link', { name: /staff inbox/i })
    ).toBeInTheDocument();
  });

  it('shows ModBar for staff users', () => {
    const staffUser = { ...mockUser, permissions: { staff: true } };
    renderWithProviders(<PrivateHeader user={staffUser as never} />);
    expect(screen.getByText('ModBar')).toBeInTheDocument();
  });

  it('hides ModBar for non-staff users', () => {
    renderWithProviders(<PrivateHeader user={mockUser as never} />);
    expect(screen.queryByText('ModBar')).not.toBeInTheDocument();
  });
});
