import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ReleaseBrowsePage from '../../components/releases/ReleaseBrowsePage';

const mockUseSearchReleasesQuery = jest.fn();
const mockUseGetCommunitiesQuery = jest.fn();
const mockUseGetMeQuery = jest.fn();
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/searchApi', () => ({
  useSearchReleasesQuery: (...args: unknown[]) =>
    mockUseSearchReleasesQuery(...args)
}));

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: () => mockUseGetCommunitiesQuery()
}));

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('../../components/search/RandomLinks', () => ({
  RandomReleaseLink: () => <a href="/random">Random Release</a>,
  RandomArtistLink: () => <a href="/random-artist">Random Artist</a>
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

const makeRelease = (id: number) => ({
  id,
  title: `Release ${id}`,
  year: 2020,
  type: 'Album',
  image: null,
  communityId: 1,
  artist: { id: 1, name: 'Miles Davis' },
  tags: [{ name: 'jazz' }],
  contributions: [
    {
      id: 100,
      type: 'FLAC',
      sizeInBytes: 1073741824,
      linkStatus: 'ALIVE',
      user: { id: 10, username: 'alice' },
      _count: { consumers: 2 }
    }
  ]
});

describe('ReleaseBrowsePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(),
      mockSetSearchParams
    ]);
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 7, userRank: { permissions: {} } }
    });
    mockUseGetCommunitiesQuery.mockReturnValue({
      data: { data: [{ id: 1, name: 'Jazz Vault' }] }
    });
  });

  it('shows spinner while loading', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getByText(/failed to load results/i)).toBeInTheDocument();
  });

  it('shows empty state when no results', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getByText(/no releases found/i)).toBeInTheDocument();
  });

  it('renders release rows with artist, title, and tags', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: {
        data: [makeRelease(1), makeRelease(2)],
        meta: { total: 2 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getAllByText('Miles Davis').length).toBeGreaterThan(0);
    expect(screen.getByText('Release 1')).toBeInTheDocument();
    expect(screen.getByText('Release 2')).toBeInTheDocument();
    expect(screen.getAllByText('jazz').length).toBeGreaterThan(0);
  });

  it('updates search params on form submit', async () => {
    const user = userEvent.setup();
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    await user.type(searchInput, 'Kind of Blue');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('q')).toBe('Kind of Blue');
  });

  it('reads params from URL and passes to query', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('q=jazz&tags=modal&page=2'),
      mockSetSearchParams
    ]);
    renderWithProviders(<ReleaseBrowsePage />);
    expect(mockUseSearchReleasesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'jazz', tags: 'modal', page: 2 })
    );
  });

  it('shows pagination buttons and navigates when a page is clicked', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 7, userRank: { permissions: { advanced_search: true } } }
    });
    mockUseSearchReleasesQuery.mockReturnValue({
      data: {
        data: [makeRelease(1)],
        meta: { total: 50, page: 1, totalPages: 3 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2' }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('page')).toBe('2');
  });

  it('shows and hides advanced options when the toggle is clicked', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 7, userRank: { permissions: { advanced_search: true } } }
    });
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.queryByLabelText(/artist name/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /advanced options/i }));
    expect(screen.getByLabelText(/artist name/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /hide advanced/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /hide advanced/i }));
    expect(screen.queryByLabelText(/artist name/i)).not.toBeInTheDocument();
  });

  it('submits advanced search with canAdvanced=true including checked flags', async () => {
    const user = userEvent.setup();
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 7, userRank: { permissions: { advanced_search: true } } }
    });
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'hasLog=true&hasCue=true&isScene=true&vanityHouse=true'
      ),
      mockSetSearchParams
    ]);
    renderWithProviders(<ReleaseBrowsePage />);
    // Show advanced fields so checkboxes are in the DOM (pre-checked from URL)
    await user.click(screen.getByRole('button', { name: /advanced options/i }));
    fireEvent.submit(document.querySelector('form')!);
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('hasLog')).toBe('true');
    expect(params.get('hasCue')).toBe('true');
  });

  it('submits with canAdvanced=true but no checked flags (covers false branches of hasLog etc.)', async () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 7, userRank: { permissions: { advanced_search: true } } }
    });
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    // Submit without opening advanced options → checkboxes not in DOM → all fd.get() returns null
    fireEvent.submit(document.querySelector('form')!);
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('hasLog')).toBeNull();
  });

  it('resets search params when Reset button is clicked', async () => {
    const user = userEvent.setup();
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    await user.click(screen.getByRole('button', { name: /^reset$/i }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.toString()).toBe('');
  });

  it('shows singular "result" label when total is 1', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: {
        data: [makeRelease(1)],
        meta: { total: 1, page: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('renders release as plain text when communityId is null', () => {
    const releaseNoCommunity = { ...makeRelease(5), communityId: null };
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [releaseNoCommunity], meta: { total: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getByText('Release 5')).toBeInTheDocument();
  });

  it('submits with non-default tagMode, orderBy, and order', async () => {
    const user = userEvent.setup();
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    await user.click(screen.getByRole('radio', { name: /all/i }));
    await user.selectOptions(screen.getByLabelText(/order by/i), 'year');
    await user.selectOptions(
      screen
        .getAllByRole('combobox')
        .find((el) => (el as HTMLSelectElement).value === 'desc')!,
      'asc'
    );
    fireEvent.submit(document.querySelector('form')!);
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('tagMode')).toBe('all');
    expect(params.get('orderBy')).toBe('year');
    expect(params.get('order')).toBe('asc');
  });

  it('shows random release and artist links', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getByText('Random Release')).toBeInTheDocument();
    expect(screen.getByText('Random Artist')).toBeInTheDocument();
  });
});
