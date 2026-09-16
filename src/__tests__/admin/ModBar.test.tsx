import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ModBar from '../../components/admin/ModBar';

const mockUseAppSelector = jest.fn();
const mockUseGetReportCountsQuery = jest.fn();
const mockUseGetInstallStatusQuery = jest.fn();
const mockDismissInstallChecklistItem = jest.fn();

jest.mock('../../store/hooks', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args)
}));

jest.mock('../../store/services/reportsApi', () => ({
  useGetReportCountsQuery: () => mockUseGetReportCountsQuery()
}));

jest.mock('../../store/services/installApi', () => ({
  // Args forwarded, not swallowed: ModBar is the one caller that passes query
  // options, and the polling interval is part of what this spec pins (#327).
  useGetInstallStatusQuery: (...args: unknown[]) =>
    mockUseGetInstallStatusQuery(...args),
  useDismissInstallChecklistItemMutation: () => [
    mockDismissInstallChecklistItem
  ]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const staffUser = {
  id: 1,
  username: 'moduser',
  avatar: null,
  userRank: {
    level: 500,
    name: 'Staff',
    color: '#fff',
    permissions: { staff: true }
  }
};

const staffToolUser = {
  ...staffUser,
  userRank: {
    ...staffUser.userRank,
    permissions: {
      ...staffUser.userRank.permissions,
      reports_manage: true
    }
  }
};

const regularUser = {
  id: 2,
  username: 'regularuser',
  avatar: null,
  userRank: { level: 100, name: 'User', color: '#fff', permissions: {} }
};

describe('ModBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetReportCountsQuery.mockReturnValue({ data: { open: 0 } });
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { setupChecklist: [] }
    });
  });

  it('renders nothing for non-staff users', () => {
    mockUseAppSelector.mockReturnValue(regularUser);
    const { container } = renderWithProviders(<ModBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Toolbox and Reports links for staff with tool access', () => {
    mockUseAppSelector.mockReturnValue(staffToolUser);
    renderWithProviders(<ModBar />);
    expect(screen.getByRole('link', { name: /toolbox/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
  });

  it('renders Reports but not Toolbox for staff without tool access', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    renderWithProviders(<ModBar />);
    expect(
      screen.queryByRole('link', { name: /toolbox/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
  });

  it('shows report count badge when open count is greater than zero', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    mockUseGetReportCountsQuery.mockReturnValue({ data: { open: 7 } });
    renderWithProviders(<ModBar />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('hides report badge when count is zero', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    mockUseGetReportCountsQuery.mockReturnValue({ data: { open: 0 } });
    renderWithProviders(<ModBar />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('uses 0 fallback when reportCounts is undefined', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    mockUseGetReportCountsQuery.mockReturnValue({ data: undefined });
    renderWithProviders(<ModBar />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
  });

  it('shows unresolved launch checklist items when setup is incomplete', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: {
        setupChecklist: [
          {
            id: 'registration-closed',
            message: 'registrationStatus is "closed".'
          },
          {
            id: 'site-url-default',
            message: 'STELLAR_SITE_URL is not set.'
          }
        ]
      }
    });

    renderWithProviders(<ModBar />);

    expect(
      screen.getByText(/configuration steps to complete before launch/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/registrationStatus is "closed"/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/STELLAR_SITE_URL is not set/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /open settings/i })
    ).toHaveAttribute('href', '/staff/tools/settings');
  });

  it('dismisses a checklist item', async () => {
    const user = userEvent.setup();
    mockUseAppSelector.mockReturnValue(staffUser);
    mockDismissInstallChecklistItem.mockReturnValue({ unwrap: jest.fn() });
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: {
        setupChecklist: [
          {
            id: 'max-users-default',
            message: 'maxUsers is still the default value.'
          }
        ]
      }
    });

    renderWithProviders(<ModBar />);
    await user.click(
      screen.getByRole('button', { name: /dismiss max-users-default/i })
    );

    expect(mockDismissInstallChecklistItem).toHaveBeenCalledWith(
      'max-users-default'
    );
  });

  describe('the site-full banner (#327)', () => {
    const FULL = /the site is full — every seat is taken/i;

    it('shows the banner while registrationFull is true', () => {
      mockUseAppSelector.mockReturnValue(staffUser);
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: { setupChecklist: [], registrationFull: true }
      });

      renderWithProviders(<ModBar />);

      expect(screen.getByRole('status')).toHaveTextContent(FULL);
      expect(
        screen.getByRole('link', { name: /open settings/i })
      ).toHaveAttribute('href', '/staff/tools/settings');
    });

    it('hides the banner while the site is not full', () => {
      mockUseAppSelector.mockReturnValue(staffUser);
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: { setupChecklist: [], registrationFull: false }
      });

      renderWithProviders(<ModBar />);

      expect(screen.queryByText(FULL)).not.toBeInTheDocument();
    });

    it('offers no way to dismiss it', () => {
      // A checklist item dismisses permanently by id, which would leave the
      // banner silent the next time the site filled. Assert against the banner
      // itself, not the bar: the checklist's own × must still be there.
      mockUseAppSelector.mockReturnValue(staffUser);
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: {
          registrationFull: true,
          setupChecklist: [
            {
              id: 'max-users-default',
              message: 'maxUsers is still the default value.'
            }
          ]
        }
      });

      renderWithProviders(<ModBar />);

      const banner = screen.getByRole('status');
      expect(banner).toHaveTextContent(FULL);
      expect(within(banner).queryByRole('button')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /dismiss max-users-default/i })
      ).toBeInTheDocument();
    });

    it('polls so a site that fills mid-session still raises it', () => {
      // App.tsx holds a root subscription and nothing calls setupListeners, so
      // an unpolled read would be the boot-time snapshot for the whole session.
      mockUseAppSelector.mockReturnValue(staffUser);
      renderWithProviders(<ModBar />);

      expect(mockUseGetInstallStatusQuery).toHaveBeenCalledWith(undefined, {
        pollingInterval: 5 * 60 * 1000
      });
    });
  });

  it('hides the launch checklist when there are no unresolved items', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { setupChecklist: [] }
    });

    renderWithProviders(<ModBar />);

    expect(
      screen.queryByText(/configuration steps to complete before launch/i)
    ).not.toBeInTheDocument();
  });
});
