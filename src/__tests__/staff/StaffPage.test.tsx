import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import StaffPage from '../../components/staff/StaffPage';

const mockUseGetStaffQuery = jest.fn();

jest.mock('../../store/services/staffApi', () => ({
  useGetStaffQuery: () => mockUseGetStaffQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

describe('StaffPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders staff grouped, with member links and ranks', () => {
    mockUseGetStaffQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        groups: [
          {
            id: 1,
            name: 'Administration',
            sortOrder: 0,
            members: [
              {
                userId: 7,
                username: 'alice',
                rankName: 'SysOp',
                rankColor: '#fff',
                lastSeen: null,
                staffBio: null
              }
            ]
          }
        ]
      }
    });
    renderWithProviders(<StaffPage />);

    expect(
      screen.getByRole('heading', { name: 'Administration' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'alice' })).toHaveAttribute(
      'href',
      '/user/7'
    );
    expect(screen.getByText('SysOp')).toBeInTheDocument();
    // Member-facing CTA to open a ticket.
    expect(
      screen.getByRole('link', { name: /contact staff/i })
    ).toHaveAttribute('href', '/inbox/staff/new');
    // Members render on the kit grid table.
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
  });

  it('shows an empty message when no groups are configured', () => {
    mockUseGetStaffQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { groups: [] }
    });
    renderWithProviders(<StaffPage />);

    expect(screen.getByText(/no staff groups configured/i)).toBeInTheDocument();
  });

  it('surfaces a load error', () => {
    mockUseGetStaffQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined
    });
    renderWithProviders(<StaffPage />);

    expect(screen.getByText(/failed to load staff list/i)).toBeInTheDocument();
  });
});
