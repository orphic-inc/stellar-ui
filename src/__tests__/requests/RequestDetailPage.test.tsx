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
