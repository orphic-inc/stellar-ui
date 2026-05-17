import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import WikiListPage from '../../components/wiki/WikiListPage';

const mockUseGetMeQuery = jest.fn();
const mockUseGetWikiPagesQuery = jest.fn();
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('../../store/services/wikiApi', () => ({
  useGetWikiPagesQuery: (...args: unknown[]) =>
    mockUseGetWikiPagesQuery(...args)
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => mockUseSearchParams()
}));

describe('WikiListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 9,
        username: 'editor',
        userRank: { permissions: { wiki_edit: true } }
      }
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('q=synth&type=title&page=2'),
      mockSetSearchParams
    ]);
    mockUseGetWikiPagesQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 12,
            title: 'Synth History',
            revision: 3,
            updatedAt: '2026-05-17T12:00:00.000Z',
            minReadLevel: 100,
            author: { username: 'alice' }
          }
        ],
        meta: { totalPages: 3 }
      },
      isLoading: false,
      error: undefined
    });
  });

  it('queries from search params and lets an editor change sort and clear filters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WikiListPage />);

    expect(mockUseGetWikiPagesQuery).toHaveBeenCalledWith({
      q: 'synth',
      type: 'title',
      order: 'title',
      way: 'asc',
      page: 2
    });
    expect(
      screen.getByRole('link', { name: /\+ new page/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/restricted \(level 100\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /created/i }));
    let next = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(next.get('order')).toBe('created');
    expect(next.get('way')).toBe('asc');
    expect(next.get('page')).toBe('1');

    await user.click(screen.getByRole('button', { name: /^clear$/i }));
    next = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(next.toString()).toBe('');
  });

  it('shows an error state without the create button for a reader', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        id: 4,
        username: 'reader',
        userRank: { permissions: {} }
      }
    });
    mockUseGetWikiPagesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });

    renderWithProviders(<WikiListPage />);

    expect(screen.getByText(/failed to load wiki pages/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /\+ new page/i })
    ).not.toBeInTheDocument();
  });
});
