import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import InviteTreePage from '../../components/staff/InviteTreePage';

const mockUseGetInviteTreeQuery = jest.fn();

jest.mock('../../store/services/adminApi', () => ({
  useGetInviteTreeQuery: () => mockUseGetInviteTreeQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const makeRow = (id: number) => ({
  id,
  user: { id, username: `user${id}` },
  inviter: { id: id + 100, username: `inviter${id}` },
  treeId: id,
  treeLevel: 1,
  treePosition: id
});

describe('InviteTreePage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a spinner while loading', () => {
    mockUseGetInviteTreeQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<InviteTreePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the grid table with member links', () => {
    mockUseGetInviteTreeQuery.mockReturnValue({
      data: { data: [makeRow(1)], meta: { page: 1, totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<InviteTreePage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'user1' })).toHaveAttribute(
      'href',
      '/private/user/1'
    );
  });

  it('does not crash when meta is missing (guarded pagination)', () => {
    mockUseGetInviteTreeQuery.mockReturnValue({
      data: { data: [makeRow(1)] },
      isLoading: false
    });
    renderWithProviders(<InviteTreePage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockUseGetInviteTreeQuery.mockReturnValue({
      data: { data: [], meta: { page: 1, totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<InviteTreePage />);
    expect(screen.getByText(/no invite tree data/i)).toBeInTheDocument();
  });
});
