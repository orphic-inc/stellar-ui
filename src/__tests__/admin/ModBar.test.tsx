import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ModBar from '../../components/admin/ModBar';

const mockUseAppSelector = jest.fn();
const mockUseGetReportCountsQuery = jest.fn();

jest.mock('../../store/hooks', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args)
}));

jest.mock('../../store/services/reportsApi', () => ({
  useGetReportCountsQuery: () => mockUseGetReportCountsQuery()
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
});
