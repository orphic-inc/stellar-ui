import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import { setCredentials } from '../../store/slices/authSlice';
import RequestDetailPage from '../../components/requests/RequestDetailPage';

const mockUseGetRequestQuery = jest.fn();
const mockUseGetRequestBountyHistoryQuery = jest.fn();
const mockCommentsSection = jest.fn((_: unknown) => (
  <div>Comments Section</div>
));
const mockAddBounty = jest.fn();
const mockFillRequest = jest.fn();
const mockUnfillRequest = jest.fn();
const mockDeleteRequest = jest.fn();
const mockToggleVote = jest.fn();
const mockToggleBookmark = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/requestApi', () => ({
  useGetRequestQuery: (...args: unknown[]) => mockUseGetRequestQuery(...args),
  useAddBountyMutation: () => [mockAddBounty, { isLoading: false }],
  useFillRequestMutation: () => [mockFillRequest, { isLoading: false }],
  useUnfillRequestMutation: () => [mockUnfillRequest, { isLoading: false }],
  useDeleteRequestMutation: () => [mockDeleteRequest, { isLoading: false }],
  useToggleRequestVoteMutation: () => [mockToggleVote, { isLoading: false }],
  useGetRequestBountyHistoryQuery: (...args: unknown[]) =>
    mockUseGetRequestBountyHistoryQuery(...args)
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleRequestBookmarkMutation: () => [
    mockToggleBookmark,
    { isLoading: false }
  ]
}));

jest.mock('../../components/layout/CommentsSection', () => ({
  __esModule: true,
  default: (props: unknown) => mockCommentsSection(props)
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '12' }),
  useNavigate: () => mockNavigate
}));

describe('RequestDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    mockUseGetRequestBountyHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false
    });
    mockAddBounty.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockFillRequest.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockUnfillRequest.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockDeleteRequest.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockToggleVote.mockReturnValue({
      unwrap: () => Promise.resolve({ voted: true })
    });
    mockToggleBookmark.mockReturnValue({
      unwrap: () => Promise.resolve({ bookmarked: true })
    });
  });

  it('lets the owner vote, bookmark, add bounty, fill, inspect history, and delete an open request', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'Need this album',
        description: 'Detailed request',
        type: 'Music',
        year: 2001,
        status: 'open',
        totalBounty: '104857600',
        filledContributionId: null,
        community: { id: 2, name: 'Jazz' },
        user: { id: 7, username: 'alice' },
        bounties: [
          {
            id: 1,
            requestId: 12,
            userId: 7,
            amount: '104857600',
            createdAt: '2026-05-17T12:00:00.000Z',
            user: { id: 7, username: 'alice' }
          }
        ],
        voteCount: 2
      },
      isLoading: false,
      error: undefined
    });
    mockUseGetRequestBountyHistoryQuery.mockReturnValue({
      data: [
        {
          id: 9,
          amount: '104857600',
          createdAt: '2026-05-17T12:00:00.000Z',
          user: { id: 7, username: 'alice' }
        }
      ],
      isLoading: false
    });

    renderWithProviders(<RequestDetailPage />, { store });

    await user.click(screen.getByTitle('Vote'));
    await user.click(screen.getByTitle('Bookmark'));
    await user.type(
      screen.getByPlaceholderText(/bytes \(e\.g\. 104857600\)/i),
      '209715200'
    );
    await user.click(screen.getByRole('button', { name: /add bounty/i }));
    await user.type(screen.getByPlaceholderText(/contribution id/i), '55');
    await user.click(screen.getByRole('button', { name: /fill request/i }));
    await user.click(screen.getByRole('button', { name: /bounty history/i }));
    await user.click(screen.getByRole('button', { name: /delete request/i }));

    await waitFor(() => {
      expect(mockToggleVote).toHaveBeenCalledWith(12);
      expect(mockToggleBookmark).toHaveBeenCalledWith(12);
      expect(mockAddBounty).toHaveBeenCalledWith({
        requestId: 12,
        amount: '209715200'
      });
      expect(mockFillRequest).toHaveBeenCalledWith({
        requestId: 12,
        contributionId: 55
      });
      expect(mockDeleteRequest).toHaveBeenCalledWith(12);
      expect(mockNavigate).toHaveBeenCalledWith('/private/requests');
      expect(mockCommentsSection).toHaveBeenCalledWith({
        page: 'requests',
        pageId: 12
      });
      expect(screen.getAllByText('100.00 MiB').length).toBeGreaterThan(0);
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Request bookmarked.')).toBe(true);
      expect(alerts.some((a) => a.msg === 'Bounty added.')).toBe(true);
      expect(alerts.some((a) => a.msg === 'Request filled!')).toBe(true);
    });
  });

  it('lets staff unfill a filled request and surfaces API failures', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 99,
        username: 'mod',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'Filled request',
        description: 'Filled state',
        type: 'Music',
        year: null,
        status: 'filled',
        totalBounty: '1073741824',
        filledContributionId: 88,
        community: { id: 2, name: 'Jazz' },
        user: { id: 7, username: 'alice' },
        filler: { id: 5, username: 'uploader' },
        bounties: []
      },
      isLoading: false,
      error: undefined
    });
    mockUnfillRequest.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { msg: 'Cannot unfill this request' } })
    });

    renderWithProviders(<RequestDetailPage />, { store });

    expect(
      screen.queryByRole('button', { name: /fill request/i })
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(/reason \(optional\)/i),
      'Bad fill'
    );
    await user.click(screen.getByRole('button', { name: /^unfill$/i }));

    await waitFor(() => {
      expect(mockUnfillRequest).toHaveBeenCalledWith({
        requestId: 12,
        reason: 'Bad fill'
      });
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Cannot unfill this request')).toBe(
        true
      );
    });
  });

  it('dispatches danger alerts for all action failures without API error messages', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'Open Request',
        description: '',
        type: 'Music',
        year: null,
        status: 'open',
        totalBounty: '0',
        filledContributionId: null,
        community: null,
        user: null,
        bounties: []
      },
      isLoading: false,
      error: undefined
    });
    mockToggleVote.mockReturnValue({ unwrap: () => Promise.reject({}) });
    mockToggleBookmark.mockReturnValue({ unwrap: () => Promise.reject({}) });
    mockAddBounty.mockReturnValue({ unwrap: () => Promise.reject({}) });
    mockFillRequest.mockReturnValue({ unwrap: () => Promise.reject({}) });

    renderWithProviders(<RequestDetailPage />, { store });

    await user.click(screen.getByTitle('Vote'));
    await user.click(screen.getByTitle('Bookmark'));

    await user.type(
      screen.getByPlaceholderText(/bytes \(e\.g\. 104857600\)/i),
      '1024'
    );
    await user.click(screen.getByRole('button', { name: /add bounty/i }));

    await user.type(screen.getByPlaceholderText(/contribution id/i), '5');
    await user.click(screen.getByRole('button', { name: /fill request/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to vote.')).toBe(true);
      expect(alerts.some((a) => a.msg === 'Failed to update bookmark.')).toBe(
        true
      );
      expect(alerts.some((a) => a.msg === 'Failed to add bounty.')).toBe(true);
      expect(alerts.some((a) => a.msg === 'Failed to fill request.')).toBe(
        true
      );
    });
  });

  it('dispatches danger alert on unfill failure and delete failure without API message', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 99,
        username: 'mod',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'Filled request',
        description: '',
        type: 'Music',
        year: null,
        status: 'filled',
        totalBounty: '1024',
        filledContributionId: 88,
        community: null,
        user: null,
        filler: { id: 5, username: 'uploader' },
        bounties: []
      },
      isLoading: false,
      error: undefined
    });
    mockUnfillRequest.mockReturnValue({ unwrap: () => Promise.reject({}) });
    mockDeleteRequest.mockReturnValue({ unwrap: () => Promise.reject({}) });

    renderWithProviders(<RequestDetailPage />, { store });

    expect(screen.getByText('1.00 KiB')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^unfill$/i }));
    window.confirm = jest.fn(() => true);
    await user.click(screen.getByRole('button', { name: /delete request/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to unfill request.')).toBe(
        true
      );
      expect(alerts.some((a) => a.msg === 'Failed to delete.')).toBe(true);
    });
  });

  it('shows formatBytes B case and null bounty user fallback', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'No bounty request',
        description: '',
        type: 'Music',
        year: null,
        status: 'open',
        totalBounty: '512',
        filledContributionId: null,
        community: null,
        user: null,
        bounties: [{ id: 1, requestId: 12, userId: 99, amount: '256', createdAt: '2026-01-01', user: null }]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<RequestDetailPage />, { store });
    expect(screen.getByText('512 B')).toBeInTheDocument();
    expect(screen.getByText('256 B')).toBeInTheDocument();
    expect(screen.getByText('User #99')).toBeInTheDocument();
  });

  it('dispatches success alert on successful unfill', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 99,
        username: 'mod',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'Filled request',
        description: '',
        type: 'Music',
        year: null,
        status: 'filled',
        totalBounty: '0',
        filledContributionId: 88,
        community: null,
        user: null,
        filler: { id: 5, username: 'uploader' },
        bounties: []
      },
      isLoading: false,
      error: undefined
    });
    mockUnfillRequest.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });

    renderWithProviders(<RequestDetailPage />, { store });
    await user.click(screen.getByRole('button', { name: /^unfill$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Request unfilled.')).toBe(true);
    });
  });

  it('dispatches bookmark removed alert and skips add bounty when input is empty', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'Open Request',
        description: '',
        type: 'Music',
        year: null,
        status: 'open',
        totalBounty: '0',
        filledContributionId: null,
        community: null,
        user: null,
        bounties: []
      },
      isLoading: false,
      error: undefined
    });
    mockToggleBookmark.mockReturnValue({
      unwrap: () => Promise.resolve({ bookmarked: false })
    });

    renderWithProviders(<RequestDetailPage />, { store });

    await user.click(screen.getByTitle('Bookmark'));
    await user.click(screen.getByRole('button', { name: /add bounty/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Bookmark removed.')).toBe(true);
      expect(mockAddBounty).not.toHaveBeenCalled();
    });
  });

  it('does not delete when confirm returns false; shows null filler and empty bounty history', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 99,
        title: 'Filled with no filler',
        description: '',
        type: 'Music',
        year: null,
        status: 'filled',
        totalBounty: '0',
        filledContributionId: 88,
        community: null,
        user: null,
        filler: null,
        bounties: []
      },
      isLoading: false,
      error: undefined
    });
    mockUseGetRequestBountyHistoryQuery.mockReturnValue({
      data: [{ id: 1, amount: '0', createdAt: '2026-01-01', user: null }],
      isLoading: false
    });

    window.confirm = jest.fn(() => false);
    renderWithProviders(<RequestDetailPage />, { store });

    await user.click(screen.getByRole('button', { name: /delete request/i }));
    expect(mockDeleteRequest).not.toHaveBeenCalled();

    expect(screen.getByText(/unknown user/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /bounty history/i }));
    await waitFor(() => {
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
  });

  it('shows no bounty history message when history is empty', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseGetRequestQuery.mockReturnValue({
      data: {
        id: 12,
        userId: 7,
        title: 'Request',
        description: '',
        type: 'Music',
        year: null,
        status: 'open',
        totalBounty: '0',
        filledContributionId: null,
        community: null,
        user: null,
        bounties: []
      },
      isLoading: false,
      error: undefined
    });
    mockUseGetRequestBountyHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false
    });
    renderWithProviders(<RequestDetailPage />, { store });
    await user.click(screen.getByRole('button', { name: /bounty history/i }));
    await waitFor(() => {
      expect(screen.getByText('No bounty history.')).toBeInTheDocument();
    });
  });

  it('shows not found for a failed request lookup', () => {
    mockUseGetRequestQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });

    renderWithProviders(<RequestDetailPage />);

    expect(screen.getByText('Request not found.')).toBeInTheDocument();
  });
});
