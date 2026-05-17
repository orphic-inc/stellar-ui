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
});
