import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import WikiViewPage from '../../components/wiki/WikiViewPage';

const mockUseGetMeQuery = jest.fn();
const mockUseGetWikiPageQuery = jest.fn();
const mockDeleteWikiPage = jest.fn();
const mockAddWikiAlias = jest.fn();
const mockDeleteWikiAlias = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('../../store/services/wikiApi', () => ({
  useGetWikiPageQuery: (...args: unknown[]) => mockUseGetWikiPageQuery(...args),
  useDeleteWikiPageMutation: () => [mockDeleteWikiPage, { isLoading: false }],
  useAddWikiAliasMutation: () => [mockAddWikiAlias, { isLoading: false }],
  useDeleteWikiAliasMutation: () => [mockDeleteWikiAlias, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '12' }),
  useNavigate: () => mockNavigate
}));

describe('WikiViewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 9,
        username: 'mod-one',
        userRankLevel: 500,
        userRank: { permissions: { wiki_manage: true } }
      }
    });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Wiki Page',
        revision: 3,
        updatedAt: '2026-05-17T12:00:00.000Z',
        minReadLevel: 0,
        minEditLevel: 100,
        body: '<p>Safe body</p>',
        slug: 'wiki-page',
        author: { id: 7, username: 'alice' },
        aliases: [{ alias: 'wiki-page' }, { alias: 'old-page' }]
      },
      isLoading: false,
      error: undefined
    });
    mockDeleteWikiPage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockAddWikiAlias.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockDeleteWikiAlias.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('allows a manager to add and remove aliases and delete the page', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<WikiViewPage />, { store });

    await user.click(screen.getByRole('button', { name: /\+ add alias/i }));
    await user.type(screen.getByPlaceholderText('new-alias'), 'new-alias');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await user.click(screen.getByTitle('Remove alias'));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockAddWikiAlias).toHaveBeenCalledWith({
        id: 12,
        alias: 'new-alias'
      });
      expect(mockDeleteWikiAlias).toHaveBeenCalledWith({
        id: 12,
        alias: 'old-page'
      });
      expect(mockDeleteWikiPage).toHaveBeenCalledWith(12);
      expect(mockNavigate).toHaveBeenCalledWith('/wiki');
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Page deleted.')).toBe(true);
    });
  });

  it('shows not found when the page request fails', () => {
    mockUseGetWikiPageQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });

    renderWithProviders(<WikiViewPage />);

    expect(screen.getByText('Page not found.')).toBeInTheDocument();
  });

  it('hides management controls for a reader without wiki permissions', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 11,
        username: 'reader',
        userRankLevel: 10,
        userRank: { permissions: {} }
      }
    });

    renderWithProviders(<WikiViewPage />);

    expect(
      screen.queryByRole('link', { name: /^edit$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^delete$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /\+ add alias/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove alias')).not.toBeInTheDocument();
  });

  it('does not delete when confirm is cancelled', async () => {
    window.confirm = jest.fn(() => false);
    const user = userEvent.setup();
    renderWithProviders(<WikiViewPage />);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(mockDeleteWikiPage).not.toHaveBeenCalled();
  });

  it('shows fallback danger alert when delete fails with no API message', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockDeleteWikiPage.mockReturnValue({ unwrap: () => Promise.reject({}) });
    renderWithProviders(<WikiViewPage />, { store });
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to delete.')).toBe(true);
    });
  });

  it('dispatches danger alert when page delete fails', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockDeleteWikiPage.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Cannot delete.' } })
    });
    renderWithProviders(<WikiViewPage />, { store });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.alertType === 'danger')).toBe(true);
    });
  });

  it('does not remove alias when confirm is cancelled', async () => {
    window.confirm = jest.fn(() => false);
    const user = userEvent.setup();
    renderWithProviders(<WikiViewPage />);
    await user.click(screen.getByTitle('Remove alias'));
    expect(mockDeleteWikiAlias).not.toHaveBeenCalled();
  });

  it('shows fallback danger alert when alias removal fails with no API message', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockDeleteWikiAlias.mockReturnValue({ unwrap: () => Promise.reject({}) });
    renderWithProviders(<WikiViewPage />, { store });
    await user.click(screen.getByTitle('Remove alias'));
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to remove alias.')).toBe(
        true
      );
    });
  });

  it('dispatches danger alert when alias removal fails', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockDeleteWikiAlias.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Cannot remove alias.' } })
    });
    renderWithProviders(<WikiViewPage />, { store });

    await user.click(screen.getByTitle('Remove alias'));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.alertType === 'danger')).toBe(true);
    });
  });

  it('hides alias form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WikiViewPage />);

    await user.click(screen.getByRole('button', { name: /\+ add alias/i }));
    expect(screen.getByPlaceholderText('new-alias')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByPlaceholderText('new-alias')).toBeNull();
  });

  it('shows spinner while page is loading', () => {
    mockUseGetWikiPageQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<WikiViewPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows minReadLevel span when level is above zero', () => {
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Restricted',
        revision: 1,
        updatedAt: '2026-05-17T12:00:00.000Z',
        minReadLevel: 50,
        minEditLevel: 0,
        body: '<p>body</p>',
        slug: 'restricted',
        author: { id: 7, username: 'alice' },
        aliases: []
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<WikiViewPage />);
    expect(screen.getByText(/requires level 50 to read/i)).toBeInTheDocument();
  });

  it('shows "No aliases." when page has no aliases', () => {
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Empty',
        revision: 1,
        updatedAt: '2026-05-17T12:00:00.000Z',
        minReadLevel: 0,
        minEditLevel: 0,
        body: '<p>body</p>',
        slug: 'empty',
        author: { id: 7, username: 'alice' },
        aliases: []
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<WikiViewPage />);
    expect(screen.getByText('No aliases.')).toBeInTheDocument();
  });

  it('shows Edit but not Delete for a wiki_edit user with sufficient rank', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 20,
        username: 'editor',
        userRank: { permissions: { wiki_edit: true } }
      }
    });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Wiki Page',
        revision: 1,
        updatedAt: '2026-05-17T12:00:00.000Z',
        minReadLevel: 0,
        minEditLevel: 0,
        body: '<p>body</p>',
        slug: 'wiki-page',
        author: { id: 7, username: 'alice' },
        aliases: []
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<WikiViewPage />);
    expect(screen.getByRole('link', { name: /^edit$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^delete$/i })
    ).not.toBeInTheDocument();
  });

  it('hides Edit for a wiki_edit user whose rank is below minEditLevel', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 21,
        username: 'low-editor',
        userRankLevel: 10,
        userRank: { permissions: { wiki_edit: true } }
      }
    });
    mockUseGetWikiPageQuery.mockReturnValue({
      data: {
        id: 12,
        title: 'Wiki Page',
        revision: 1,
        updatedAt: '2026-05-17T12:00:00.000Z',
        minReadLevel: 0,
        minEditLevel: 500,
        body: '<p>body</p>',
        slug: 'wiki-page',
        author: { id: 7, username: 'alice' },
        aliases: []
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<WikiViewPage />);
    expect(
      screen.queryByRole('link', { name: /^edit$/i })
    ).not.toBeInTheDocument();
  });

  it('shows fallback danger alert when alias add fails with no API message', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockAddWikiAlias.mockReturnValue({ unwrap: () => Promise.reject({}) });
    renderWithProviders(<WikiViewPage />, { store });
    await user.click(screen.getByRole('button', { name: /\+ add alias/i }));
    await user.type(screen.getByPlaceholderText('new-alias'), 'new-alias');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to add alias.')).toBe(true);
    });
  });

  it('surfaces an alias add failure alert', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockAddWikiAlias.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Alias already in use' } })
    });

    renderWithProviders(<WikiViewPage />, { store });

    await user.click(screen.getByRole('button', { name: /\+ add alias/i }));
    await user.type(screen.getByPlaceholderText('new-alias'), 'existing');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Alias already in use')).toBe(true);
    });
  });

  it('paints the page + actions from the data-st contract', () => {
    const { container } = renderWithProviders(<WikiViewPage />, {
      store: createTestStore()
    });
    // Title → prose -strong; body/aliases → panels; aliases → chip; Edit is a
    // filled primary control, Delete a filled danger control.
    expect(
      container.querySelector('[data-st="prose"][data-st-strong]')
    ).toBeInTheDocument();
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="chip"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-st="control"][data-st-danger]')
    ).toBeInTheDocument();
  });
});
