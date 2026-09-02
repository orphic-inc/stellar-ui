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

// Mirrors what GET /users/invite-tree actually returns: a flat InviteTree row
// (id, userId, inviterId, createdAt) plus the two included user refs. The old
// fixture carried treeId/treeLevel/treePosition, which the API has never sent.
const makeRow = (id: number) => ({
  id,
  userId: id,
  inviterId: id + 100,
  createdAt: '2026-03-04T00:00:00.000Z',
  user: { id, username: `user${id}` },
  inviter: { id: id + 100, username: `inviter${id}` }
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
      '/user/1'
    );
    // The Invited column reads a real column. Its three predecessors — Tree,
    // Level and Position — rendered `undefined` for every row because the API
    // never sent those fields; nothing asserted on them, so nothing caught it.
    expect(
      screen.getByRole('columnheader', { name: 'Invited' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Level' })
    ).not.toBeInTheDocument();
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
