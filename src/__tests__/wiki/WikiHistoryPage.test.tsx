import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import WikiHistoryPage from '../../components/wiki/WikiHistoryPage';

const mockUseGetMeQuery = jest.fn();
const mockUseGetWikiRevisionsQuery = jest.fn();
const mockUseGetWikiRevisionQuery = jest.fn();
const mockUseCompareWikiRevisionsQuery = jest.fn();
const mockRollbackWikiPage = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('../../store/services/wikiApi', () => ({
  useGetWikiRevisionsQuery: (...args: unknown[]) =>
    mockUseGetWikiRevisionsQuery(...args),
  useGetWikiRevisionQuery: (...args: unknown[]) =>
    mockUseGetWikiRevisionQuery(...args),
  useCompareWikiRevisionsQuery: (...args: unknown[]) =>
    mockUseCompareWikiRevisionsQuery(...args),
  useRollbackWikiPageMutation: () => [
    mockRollbackWikiPage,
    { isLoading: false }
  ]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '12' })
}));

describe('WikiHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { wiki_edit: true } }
      }
    });
    mockUseGetWikiRevisionsQuery.mockReturnValue({
      data: {
        currentRevision: 4,
        revisions: [
          {
            id: 101,
            revision: 3,
            createdAt: '2026-05-17T12:00:00.000Z',
            author: { id: 7, username: 'alice' },
            title: 'Wiki Page'
          },
          {
            id: 102,
            revision: 2,
            createdAt: '2026-05-16T12:00:00.000Z',
            author: { id: 8, username: 'bob' },
            title: 'Wiki Page'
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    mockUseGetWikiRevisionQuery.mockReturnValue({
      data: {
        title: 'Wiki Page',
        body: '<p>Revision body</p>',
        author: { username: 'alice' },
        createdAt: '2026-05-17T12:00:00.000Z'
      },
      isLoading: false
    });
    mockUseCompareWikiRevisionsQuery.mockReturnValue({
      data: {
        title: 'Wiki Page',
        old: { body: 'old line' },
        new: { body: 'new line' }
      },
      isLoading: false,
      error: undefined
    });
    mockRollbackWikiPage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('opens compare and revision modals and allows rollback', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiHistoryPage />, { store });

    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '2');
    await user.selectOptions(screen.getByDisplayValue('New rev…'), '4');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(screen.getByText(/compare r2 → r4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    await user.click(screen.getAllByRole('button', { name: /^view$/i })[1]);
    await user.click(
      screen.getByRole('button', { name: /rollback to this revision/i })
    );

    await waitFor(() => {
      expect(mockRollbackWikiPage).toHaveBeenCalledWith({ id: 12, rev: 3 });
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Rolled back to revision 3.')).toBe(
        true
      );
    });
  });

  it('shows compare failure feedback for an editor', async () => {
    const user = userEvent.setup();
    mockUseCompareWikiRevisionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });

    renderWithProviders(<WikiHistoryPage />);

    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '2');
    await user.selectOptions(screen.getByDisplayValue('New rev…'), '4');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(screen.getByText(/failed to load comparison/i)).toBeInTheDocument();
  });

  it('hides rollback controls for a non-editor', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 3,
        username: 'reader',
        userRank: { permissions: {} }
      }
    });

    renderWithProviders(<WikiHistoryPage />);

    await user.click(screen.getAllByRole('button', { name: /^view$/i })[0]);

    expect(
      screen.queryByRole('button', { name: /rollback to this revision/i })
    ).not.toBeInTheDocument();
  });
});
