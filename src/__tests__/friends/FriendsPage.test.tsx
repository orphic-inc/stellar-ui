import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import FriendsPage from '../../components/pages/private/friends/FriendsPage';

const mockUseGetMyFriendsQuery = jest.fn();
const mockUseGetFriendRequestsQuery = jest.fn();
const mockAccept = jest.fn();
const mockReject = jest.fn();
const mockRemove = jest.fn();
const mockUpdateComment = jest.fn();

jest.mock('../../store/services/friendApi', () => ({
  useGetMyFriendsQuery: () => mockUseGetMyFriendsQuery(),
  useGetFriendRequestsQuery: () => mockUseGetFriendRequestsQuery(),
  useAcceptFriendRequestMutation: () => [mockAccept, { isLoading: false }],
  useRejectFriendRequestMutation: () => [mockReject, { isLoading: false }],
  useRemoveFriendMutation: () => [mockRemove, { isLoading: false }],
  useUpdateFriendCommentMutation: () => [
    mockUpdateComment,
    { isLoading: false }
  ]
}));

const emptyFriends = {
  data: [],
  meta: { total: 0, page: 1, limit: 25, totalPages: 1 }
};

const makeRequest = (id: number, username: string) => ({
  id,
  requesterId: id,
  createdAt: '2026-06-01T00:00:00.000Z',
  requester: { id, username, avatar: null }
});

describe('FriendsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccept.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockReject.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockUseGetFriendRequestsQuery.mockReturnValue({ data: { data: [] } });
  });

  it('shows the empty state when there are no friends', () => {
    mockUseGetMyFriendsQuery.mockReturnValue({
      data: emptyFriends,
      isLoading: false,
      error: undefined
    });

    renderWithProviders(<FriendsPage />);

    expect(
      screen.getByText("You haven't added any friends yet.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Friend requests/)).not.toBeInTheDocument();
  });

  it('renders incoming requests and accepts one', async () => {
    mockUseGetMyFriendsQuery.mockReturnValue({
      data: emptyFriends,
      isLoading: false,
      error: undefined
    });
    mockUseGetFriendRequestsQuery.mockReturnValue({
      data: { data: [makeRequest(7, 'alice')] }
    });

    renderWithProviders(<FriendsPage />);

    expect(screen.getByText('Friend requests (1)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'alice' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(mockAccept).toHaveBeenCalledWith(7);
  });

  it('rejects an incoming request', async () => {
    mockUseGetMyFriendsQuery.mockReturnValue({
      data: emptyFriends,
      isLoading: false,
      error: undefined
    });
    mockUseGetFriendRequestsQuery.mockReturnValue({
      data: { data: [makeRequest(9, 'bob')] }
    });

    renderWithProviders(<FriendsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(mockReject).toHaveBeenCalledWith(9);
  });
});
