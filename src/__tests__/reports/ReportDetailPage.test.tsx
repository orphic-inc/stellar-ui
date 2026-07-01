import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import { selectAlerts } from '../../store/slices/alertSlice';
import ReportDetailPage from '../../components/reports/ReportDetailPage';

const mockUseGetReportQuery = jest.fn();
const mockClaimReport = jest.fn();
const mockUnclaimReport = jest.fn();
const mockResolveReport = jest.fn();
const mockAddReportNote = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/reportsApi', () => ({
  useGetReportQuery: (...args: unknown[]) => mockUseGetReportQuery(...args),
  useClaimReportMutation: () => [mockClaimReport, { isLoading: false }],
  useUnclaimReportMutation: () => [mockUnclaimReport, { isLoading: false }],
  useResolveReportMutation: () => [mockResolveReport, { isLoading: false }],
  useAddReportNoteMutation: () => [mockAddReportNote, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '7' }),
  useNavigate: () => mockNavigate
}));

describe('ReportDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetReportQuery.mockReturnValue({
      data: {
        id: 7,
        targetType: 'ForumPost',
        targetId: 42,
        category: 'spam',
        reason: 'This is spam.',
        evidence: 'Quoted evidence',
        status: 'Open',
        reporter: { id: 3, username: 'alice' },
        reporterId: 3,
        claimedById: null,
        claimedBy: null,
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        resolutionAction: null,
        sourceUrl: '/private/forums/42',
        notes: [
          {
            id: 1,
            body: 'Investigated',
            createdAt: '2026-05-17T12:00:00.000Z',
            author: { username: 'mod-one' }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    mockClaimReport.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockUnclaimReport.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockResolveReport.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockAddReportNote.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('carries the data-st contract hooks (panel/chip)', () => {
    renderWithProviders(<ReportDetailPage />);
    // Detail cards are panels; the status renders as a chip.
    expect(document.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(document.querySelector('[data-st="chip"]')).toBeInTheDocument();
  });

  it('lets staff claim, resolve, and add notes to a report', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    await user.click(screen.getByRole('button', { name: /^claim$/i }));
    await user.click(screen.getByRole('button', { name: /^resolve$/i }));
    await user.type(screen.getByLabelText(/resolution notes/i), 'Removed post');
    await user.click(screen.getByRole('button', { name: /confirm resolve/i }));
    await user.type(
      screen.getByLabelText(/add moderator note/i),
      'Escalated to moderation log'
    );
    await user.click(screen.getByRole('button', { name: /add note/i }));

    await waitFor(() => {
      expect(mockClaimReport).toHaveBeenCalledWith(7);
      expect(mockResolveReport).toHaveBeenCalledWith({
        id: 7,
        resolution: 'Removed post',
        resolutionAction: 'Dismissed'
      });
      expect(mockAddReportNote).toHaveBeenCalledWith({
        id: 7,
        body: 'Escalated to moderation log'
      });
    });
  });

  it('redirects non-staff users away from forbidden reports', async () => {
    mockUseGetReportQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 403 }
    });

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 3,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/private/reports/mine', {
        replace: true
      });
    });
  });

  it('shows an alert when claim fails', async () => {
    const user = userEvent.setup();
    mockClaimReport.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail'))
    });

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    await user.click(screen.getByRole('button', { name: /^claim$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to claim report.')).toBe(
        true
      );
    });
  });

  it('shows unclaim button when claimed by current user, and alerts on unclaim failure', async () => {
    const user = userEvent.setup();
    mockUseGetReportQuery.mockReturnValue({
      data: {
        id: 7,
        targetType: 'ForumPost',
        targetId: 42,
        category: 'spam',
        reason: 'This is spam.',
        evidence: null,
        status: 'Open',
        reporter: { id: 3, username: 'alice' },
        reporterId: 3,
        claimedById: 9,
        claimedBy: { username: 'mod-one' },
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        resolutionAction: null,
        sourceUrl: '/private/forums/42',
        notes: []
      },
      isLoading: false,
      error: undefined
    });
    mockUnclaimReport.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail'))
    });

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    // Unclaim visible because claimedById === currentUser.id
    const unclaimBtn = screen.getByRole('button', { name: /^unclaim$/i });
    expect(unclaimBtn).toBeInTheDocument();

    // Click unclaim → rejection → danger alert
    await user.click(unclaimBtn);
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to unclaim report.')).toBe(
        true
      );
    });
  });

  it('calls unclaimReport successfully', async () => {
    const user = userEvent.setup();
    mockUseGetReportQuery.mockReturnValue({
      data: {
        id: 7,
        targetType: 'ForumPost',
        targetId: 42,
        category: 'spam',
        reason: 'This is spam.',
        evidence: null,
        status: 'Open',
        reporter: { id: 3, username: 'alice' },
        reporterId: 3,
        claimedById: 9,
        claimedBy: { username: 'mod-one' },
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        resolutionAction: null,
        sourceUrl: '/private/forums/42',
        notes: []
      },
      isLoading: false,
      error: undefined
    });

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    await user.click(screen.getByRole('button', { name: /^unclaim$/i }));
    await waitFor(() => {
      expect(mockUnclaimReport).toHaveBeenCalledWith(7);
    });
  });

  it('alerts on resolve failure and addNote failure', async () => {
    const user = userEvent.setup();
    mockResolveReport.mockReturnValue({
      unwrap: () => Promise.reject(new Error('resolve fail'))
    });
    mockAddReportNote.mockReturnValue({
      unwrap: () => Promise.reject(new Error('note fail'))
    });

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    // Open resolve form and submit
    await user.click(screen.getByRole('button', { name: /^resolve$/i }));
    await user.type(
      screen.getByLabelText(/resolution notes/i),
      'Some resolution'
    );
    await user.click(screen.getByRole('button', { name: /confirm resolve/i }));

    // Add note and submit
    await user.type(screen.getByLabelText(/add moderator note/i), 'A note');
    await user.click(screen.getByRole('button', { name: /add note/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to resolve report.')).toBe(
        true
      );
      expect(alerts.some((a) => a.msg === 'Failed to add note.')).toBe(true);
    });
  });

  it('shows spinner while loading', () => {
    mockUseGetReportQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ReportDetailPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when report not found', () => {
    mockUseGetReportQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<ReportDetailPage />, { store });
    expect(screen.getByText(/report not found/i)).toBeInTheDocument();
  });

  it('does not submit resolve form when resolution is empty, does not submit note when body is empty', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    // Open resolve form but submit without typing
    await user.click(screen.getByRole('button', { name: /^resolve$/i }));
    await user.click(screen.getByRole('button', { name: /confirm resolve/i }));
    expect(mockResolveReport).not.toHaveBeenCalled();

    // Submit note form without typing
    await user.click(screen.getByRole('button', { name: /add note/i }));
    expect(mockAddReportNote).not.toHaveBeenCalled();
  });

  it('shows resolved report with resolution section and resolvedBy attribution', () => {
    mockUseGetReportQuery.mockReturnValue({
      data: {
        id: 7,
        targetType: 'User',
        targetId: 5,
        category: 'harassment',
        reason: 'Harassed a user.',
        evidence: null,
        status: 'Resolved',
        reporter: { id: 3, username: 'alice' },
        reporterId: 3,
        claimedById: 9,
        claimedBy: { username: 'mod-one' },
        resolvedBy: { username: 'mod-one' },
        resolvedAt: '2026-05-17T14:00:00.000Z',
        resolution: 'User warned about behavior.',
        resolutionAction: 'UserWarned',
        sourceUrl: null,
        notes: []
      },
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    expect(screen.getByText('UserWarned')).toBeInTheDocument();
    expect(screen.getByText('User warned about behavior.')).toBeInTheDocument();
    expect(screen.getByText(/resolved by mod-one/i)).toBeInTheDocument();
    // Resolve button hidden when already resolved
    expect(
      screen.queryByRole('button', { name: /^resolve$/i })
    ).not.toBeInTheDocument();
  });

  it('renders non-staff view with My Reports back link', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 3,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    expect(
      screen.getByRole('link', { name: /my reports/i })
    ).toBeInTheDocument();
    // Staff-only actions not visible
    expect(
      screen.queryByRole('button', { name: /^claim$/i })
    ).not.toBeInTheDocument();
  });

  it('changes resolutionAction select and cancels resolve form', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store });

    // Open the resolve form
    await user.click(screen.getByRole('button', { name: /^resolve$/i }));
    expect(screen.getByLabelText(/resolution notes/i)).toBeInTheDocument();

    // Change the action select
    await user.selectOptions(
      screen.getByRole('combobox', { name: /action taken/i }),
      'UserWarned'
    );

    // Cancel closes the form
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(
      screen.queryByLabelText(/resolution notes/i)
    ).not.toBeInTheDocument();
  });
});
