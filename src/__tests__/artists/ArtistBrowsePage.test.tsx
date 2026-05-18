import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ArtistBrowsePage from '../../components/artists/ArtistBrowsePage';

const mockUseSearchArtistsQuery = jest.fn();
const mockUseGetMeQuery = jest.fn();
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/searchApi', () => ({
  useSearchArtistsQuery: (...args: unknown[]) =>
    mockUseSearchArtistsQuery(...args)
}));

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => mockUseSearchParams(),
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  )
}));

const makeArtist = (id: number, name: string) => ({
  id,
  name,
  vanityHouse: false,
  tags: [{ tag: { id: 1, name: 'jazz' } }],
  _count: { releases: id * 3 }
});

describe('ArtistBrowsePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(),
      mockSetSearchParams
    ]);
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 1, userRank: { permissions: {} } }
    });
  });

  it('shows spinner while loading', () => {
    mockUseSearchArtistsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseSearchArtistsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<ArtistBrowsePage />);
    expect(screen.getByText(/failed to load results/i)).toBeInTheDocument();
  });

  it('shows no artists found on empty result', () => {
    mockUseSearchArtistsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    expect(screen.getByText(/no artists found/i)).toBeInTheDocument();
  });

  it('renders artist list with name, tags, and release count', () => {
    mockUseSearchArtistsQuery.mockReturnValue({
      data: {
        data: [
          makeArtist(1, 'Miles Davis'),
          makeArtist(2, 'John Coltrane')
        ],
        meta: { total: 2, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    expect(screen.getByRole('link', { name: 'Miles Davis' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'John Coltrane' })).toBeInTheDocument();
    expect(screen.getAllByText('jazz').length).toBeGreaterThan(0);
  });

  it('shows vanity house label when applicable', () => {
    mockUseSearchArtistsQuery.mockReturnValue({
      data: {
        data: [{ ...makeArtist(1, 'VH Artist'), vanityHouse: true }],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    expect(screen.getByText(/vanity house/i)).toBeInTheDocument();
  });

  it('updates search params on form submit', async () => {
    const user = userEvent.setup();
    mockUseSearchArtistsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    await user.type(screen.getByPlaceholderText(/search artists/i), 'Coltrane');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    const params = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(params.get('q')).toBe('Coltrane');
  });

  it('resets search params on Reset click', async () => {
    const user = userEvent.setup();
    mockUseSearchArtistsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    const params = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(params.toString()).toBe('');
  });

  it('hides advanced search options for non-privileged users', () => {
    mockUseSearchArtistsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    expect(
      screen.queryByText(/advanced options/i)
    ).not.toBeInTheDocument();
  });

  it('shows advanced options toggle for users with advanced_search permission', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 2, userRank: { permissions: { advanced_search: true } } }
    });
    mockUseSearchArtistsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistBrowsePage />);
    const toggle = screen.getByRole('button', { name: /\+ advanced options/i });
    await user.click(toggle);
    expect(screen.getByText(/vanity house only/i)).toBeInTheDocument();
  });
});
