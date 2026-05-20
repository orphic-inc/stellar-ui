import React from 'react';
import { screen } from '@testing-library/react';
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
  useGetInstallStatusQuery: () => mockUseGetInstallStatusQuery(),
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

  it('renders Toolbox and Reports links for staff', () => {
    mockUseAppSelector.mockReturnValue(staffUser);
    renderWithProviders(<ModBar />);
    expect(screen.getByRole('link', { name: /toolbox/i })).toBeInTheDocument();
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
            id: 'registration-open',
            message: 'registrationStatus is still "open".'
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
      screen.getByText(/registrationStatus is still "open"/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/STELLAR_SITE_URL is not set/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /open settings/i })
    ).toHaveAttribute('href', '/private/staff/tools/settings');
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
