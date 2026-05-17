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
      expect(mockNavigate).toHaveBeenCalledWith('/private/wiki');
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
});
