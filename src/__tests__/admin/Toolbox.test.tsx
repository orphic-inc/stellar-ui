import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import Toolbox from '../../components/admin/Toolbox';

const mockUseAppSelector = jest.fn();

jest.mock('../../store/hooks', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args)
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const adminUser = {
  id: 1,
  username: 'admin',
  avatar: null,
  userRank: {
    level: 1000,
    name: 'SysOp',
    color: '#fff',
    permissions: {
      admin: true,
      staff: true,
      news_manage: true,
      communities_manage: true,
      forums_manage: true,
      users_edit: true
    }
  }
};

const staffUser = {
  id: 2,
  username: 'staffmember',
  avatar: null,
  userRank: {
    level: 500,
    name: 'Staff',
    color: '#fff',
    permissions: {
      staff_inbox_manage: true,
      reports_manage: true,
      messages_mass_pm: true
    }
  }
};

const unprivilegedUser = {
  id: 3,
  username: 'nobody',
  avatar: null,
  userRank: { level: 100, name: 'User', color: '#fff', permissions: {} }
};

describe('Toolbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows admin-only links for admin user', () => {
    mockUseAppSelector.mockReturnValue(adminUser);
    renderWithProviders(<Toolbox />);
    expect(
      screen.getByRole('link', { name: /user ranks/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /site settings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /donor ranks/i })
    ).toBeInTheDocument();
  });

  it('shows staff-accessible links for staff user', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    renderWithProviders(<Toolbox />);
    // The ticket queue moved to the Staff Inbox nav (one role-dispatched entry),
    // so it is no longer a standalone Toolbox tool; canned responses remains the
    // staff_inbox_manage Toolbox affordance.
    expect(
      screen.queryByRole('link', { name: /ticket queue/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /canned responses/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /reports queue/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mass pm/i })).toBeInTheDocument();
  });

  it('shows only news link for user with news_manage permission only', () => {
    mockUseAppSelector.mockReturnValue({
      id: 4,
      username: 'newseditor',
      avatar: null,
      userRank: {
        level: 200,
        name: 'Power User',
        color: '#fff',
        permissions: { news_manage: true }
      }
    });
    renderWithProviders(<Toolbox />);
    expect(
      screen.getByRole('link', { name: /news post/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /user ranks/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /ticket queue/i })
    ).not.toBeInTheDocument();
  });

  it('shows no-tools message for user without any staff permissions', () => {
    mockUseAppSelector.mockReturnValue(unprivilegedUser);
    renderWithProviders(<Toolbox />);
    expect(
      screen.getByText(/does not currently have any staff tools/i)
    ).toBeInTheDocument();
  });

  it('links to correct URLs', () => {
    mockUseAppSelector.mockReturnValue(adminUser);
    renderWithProviders(<Toolbox />);
    expect(screen.getByRole('link', { name: /user ranks/i })).toHaveAttribute(
      'href',
      '/staff/tools/user-ranks'
    );
  });

  it('renders the collapsed 7-section taxonomy for an admin', () => {
    mockUseAppSelector.mockReturnValue(adminUser);
    renderWithProviders(<Toolbox />);
    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      'Administration',
      'Users',
      'Moderation',
      'Content',
      'Announcements',
      'Finance',
      'Insights'
    ]);
    // The pre-collapse grab-bag/overlap sections are gone.
    for (const stale of [
      'User Management',
      'Managers',
      'Community',
      'Site Information',
      'Development',
      'Finances'
    ]) {
      expect(
        screen.queryByRole('heading', { level: 3, name: stale })
      ).not.toBeInTheDocument();
    }
  });
});
