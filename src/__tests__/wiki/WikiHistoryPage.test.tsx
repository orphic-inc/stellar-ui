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

let mockIsRollingBack = false;

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
    { isLoading: mockIsRollingBack }
  ]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '12' })
}));

describe('WikiHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRollingBack = false;
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

  it('shows spinner while loading revision history', () => {
    mockUseGetWikiRevisionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<WikiHistoryPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('skips rollback when confirm dialog is cancelled', async () => {
    window.confirm = jest.fn(() => false);
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiHistoryPage />, { store });

    await user.click(screen.getAllByRole('button', { name: /^view$/i })[0]);
    await user.click(
      screen.getByRole('button', { name: /rollback to this revision/i })
    );

    expect(mockRollbackWikiPage).not.toHaveBeenCalled();
  });

  it('dispatches danger alert when rollback fails', async () => {
    mockRollbackWikiPage.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Conflict error.' } })
    });
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiHistoryPage />, { store });

    await user.click(screen.getAllByRole('button', { name: /^view$/i })[0]);
    await user.click(
      screen.getByRole('button', { name: /rollback to this revision/i })
    );

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.alertType === 'danger')).toBe(true);
    });
  });

  it('renders unchanged, added, and deleted diff lines when comparing multiline content', async () => {
    mockUseCompareWikiRevisionsQuery.mockReturnValue({
      data: {
        title: 'Wiki Page',
        old: { body: 'common line\nonly old\nold extra' },
        new: { body: 'common line\nonly new\nnew extra 1\nnew extra 2' }
      },
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);

    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '2');
    await user.selectOptions(screen.getByDisplayValue('New rev…'), '4');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    // unchanged line appears undecorated
    expect(screen.getByText('common line')).toBeInTheDocument();
    // added lines (extra new lines at end cover the oi >= oldLines.length branch)
    expect(screen.getByText('new extra 2')).toBeInTheDocument();
  });

  it('shows "No prior revisions" when revisions list is empty', () => {
    mockUseGetWikiRevisionsQuery.mockReturnValue({
      data: { currentRevision: 1, revisions: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<WikiHistoryPage />);
    expect(screen.getByText(/no prior revisions/i)).toBeInTheDocument();
  });

  it('does not open compare modal when Compare is clicked without selecting values', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.queryByText(/compare r/i)).not.toBeInTheDocument();
  });

  it('compare button stays disabled after selecting then reverting old select to placeholder', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    // Select a real revision in Old, then revert to the placeholder
    const oldSelect = screen.getByDisplayValue('Old rev…');
    await user.selectOptions(oldSelect, '2');
    // Display now shows "r2" — revert back to empty
    await user.selectOptions(screen.getByDisplayValue('r2'), '');
    expect(screen.getByRole('button', { name: /^compare$/i })).toBeDisabled();
  });

  it('does not open compare modal when only Old is selected but New is null', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '2');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.queryByText(/compare r/i)).not.toBeInTheDocument();
  });

  it('does not open compare modal when old >= new revision is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '4');
    await user.selectOptions(screen.getByDisplayValue('New rev…'), '2');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.queryByText(/compare r/i)).not.toBeInTheDocument();
  });

  it('shows loading spinner in compare modal when compare query is loading', async () => {
    mockUseCompareWikiRevisionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '2');
    await user.selectOptions(screen.getByDisplayValue('New rev…'), '4');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows fallback danger alert when rollback fails with no API message', async () => {
    mockRollbackWikiPage.mockReturnValue({ unwrap: () => Promise.reject({}) });
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiHistoryPage />, { store });
    await user.click(screen.getAllByRole('button', { name: /^view$/i })[0]);
    await user.click(
      screen.getByRole('button', { name: /rollback to this revision/i })
    );
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Rollback failed.')).toBe(true);
    });
  });

  it('shows "Rolling back…" when isRollingBack is true', async () => {
    mockIsRollingBack = true;
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.click(screen.getAllByRole('button', { name: /^view$/i })[0]);
    expect(
      screen.getByRole('button', { name: /rolling back…/i })
    ).toBeInTheDocument();
  });

  it('shows spinner in revision viewer when revision query is loading', async () => {
    mockUseGetWikiRevisionQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.click(screen.getAllByRole('button', { name: /^view$/i })[0]);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders diff with empty-text deleted lines (line.text falsy branch)', async () => {
    mockUseCompareWikiRevisionsQuery.mockReturnValue({
      data: {
        title: 'Wiki Page',
        old: { body: 'first\n\nthird' },
        new: { body: 'first\nsecond\nthird' }
      },
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '2');
    await user.selectOptions(screen.getByDisplayValue('New rev…'), '4');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('hides rollback button when revision data is unavailable (data falsy branch)', async () => {
    mockUseGetWikiRevisionQuery.mockReturnValue({
      data: undefined,
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.click(screen.getAllByRole('button', { name: /^view$/i })[0]);
    expect(
      screen.queryByRole('button', { name: /rollback to this revision/i })
    ).not.toBeInTheDocument();
  });

  it('shows error when revision history fails to load', () => {
    mockUseGetWikiRevisionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<WikiHistoryPage />);
    expect(
      screen.getByText(/failed to load revision history/i)
    ).toBeInTheDocument();
  });

  it('renders deleted diff lines when old has more lines than new', async () => {
    mockUseCompareWikiRevisionsQuery.mockReturnValue({
      data: {
        title: 'Wiki Page',
        old: { body: 'common line\nextra old line' },
        new: { body: 'common line' }
      },
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<WikiHistoryPage />);
    await user.selectOptions(screen.getByDisplayValue('Old rev…'), '2');
    await user.selectOptions(screen.getByDisplayValue('New rev…'), '4');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.getByText('extra old line')).toBeInTheDocument();
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

  it('paints the compare form + revision list from the data-st contract', () => {
    const { container } = renderWithProviders(<WikiHistoryPage />);
    // Compare form → panel with field selects + primary control; the revision
    // list is a div panel/list/row with the current row on data-st-open.
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(
      container.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-st="list"] [data-st="row"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-st="row"][data-st-open]')
    ).toBeInTheDocument();
  });
});
