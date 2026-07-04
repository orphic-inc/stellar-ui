import React from 'react';
import { screen } from '@testing-library/react';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import StaffInboxPage from '../../components/staffInbox/StaffInboxPage';

// The dispatcher's only job is choosing a child by permission; stub the two
// children so the test asserts the dispatch, not their internals.
jest.mock('../../components/staffInbox/TicketQueuePage', () => {
  const StaffQueueStub = () => <div>STAFF QUEUE</div>;
  return StaffQueueStub;
});
jest.mock('../../components/staffInbox/MyTicketsPage', () => {
  const MyTicketsStub = () => <div>MY TICKETS</div>;
  return MyTicketsStub;
});

const renderAs = (user: unknown) => {
  const store = createTestStore();
  store.dispatch(setCredentials(user as never));
  renderWithProviders(<StaffInboxPage />, { store });
};

describe('StaffInboxPage (permission dispatch)', () => {
  it('shows the staff queue to a user who can manage the inbox', () => {
    renderAs({
      id: 9,
      username: 'mod-one',
      userRank: { permissions: { staff_inbox_manage: true } }
    });
    expect(screen.getByText('STAFF QUEUE')).toBeInTheDocument();
    expect(screen.queryByText('MY TICKETS')).not.toBeInTheDocument();
  });

  it('shows a member their own tickets', () => {
    renderAs({
      id: 3,
      username: 'member',
      userRank: { permissions: {} }
    });
    expect(screen.getByText('MY TICKETS')).toBeInTheDocument();
    expect(screen.queryByText('STAFF QUEUE')).not.toBeInTheDocument();
  });
});
