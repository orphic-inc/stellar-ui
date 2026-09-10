import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ReleaseBrowsePage from '../../components/releases/ReleaseBrowsePage';

const mockUseSearchReleasesQuery = jest.fn();
const mockUseSearchReleaseGroupsQuery = jest.fn();
const mockUseGetCommunitiesQuery = jest.fn();
const mockUseGetMeQuery = jest.fn();
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/searchApi', () => ({
  useSearchReleasesQuery: (...args: unknown[]) =>
    mockUseSearchReleasesQuery(...args),
  useSearchReleaseGroupsQuery: (...args: unknown[]) =>
    mockUseSearchReleaseGroupsQuery(...args)
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
  tags: [{ id: 1, name: 'jazz' }],
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
    // Skipped in release mode, but the hook is still called, so it must return
    // the RTK Query result shape rather than undefined.
    mockUseSearchReleaseGroupsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
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
    // Second argument since #320: the hook is skipped in group mode, so both
    // searches are declared and only one runs.
    expect(mockUseSearchReleasesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'jazz', tags: 'modal', page: 2 }),
      { skip: false }
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

  it('paints the filter form from the data-st field/control/panel contract', () => {
    mockUseGetMeQuery.mockReturnValue({
      data: { id: 7, userRank: { permissions: { advanced_search: true } } }
    });
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0 } },
      isLoading: false,
      error: undefined
    });
    const { container } = renderWithProviders(<ReleaseBrowsePage />);
    // The form is a bounded surface; its inputs paint from `field`, labels
    // decompose to `meta`, and the buttons are `control`s (no inline gray).
    expect(
      container.querySelector('form[data-st="panel"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('input[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
    // Native radios/checkboxes carry `field` too, for accent-color tinting.
    expect(
      container.querySelector('input[type="radio"][data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('label[data-st="meta"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
  });

  it('renders results from the data-st table-hook contract (ADR-0006)', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: {
        data: [makeRelease(1)],
        meta: { total: 1, page: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    const { container } = renderWithProviders(<ReleaseBrowsePage />);
    // Columnar data keeps its <table>; the grid/colhead/row variant paints it.
    expect(
      container.querySelector('table[data-st="grid"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('thead[data-st="colhead"]')
    ).toBeInTheDocument();
    expect(container.querySelector('tr[data-st="row"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="title"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st-num]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="chip"]')).toBeInTheDocument();
  });

  it('paints the result count and pagination from prose/control', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: {
        data: [makeRelease(1)],
        meta: { total: 50, page: 1, totalPages: 3 }
      },
      isLoading: false,
      error: undefined
    });
    const { container } = renderWithProviders(<ReleaseBrowsePage />);
    // The result count is muted prose; the current page is a primary control.
    expect(
      container.querySelector('[data-st="prose"][data-st-muted]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
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
  // ── #320 — group mode ──────────────────────────────────────────────────────

  const inGroupMode = (extra = '') =>
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(`mode=groups${extra}`),
      mockSetSearchParams
    ]);

  const groupBody = (data: unknown[], total = data.length) => ({
    data: { data, meta: { total, page: 1, limit: 25, totalPages: 1 } },
    isLoading: false,
    error: undefined
  });

  it('runs exactly one of the two searches, decided by the mode', () => {
    inGroupMode();
    mockUseSearchReleaseGroupsQuery.mockReturnValue(groupBody([]));
    renderWithProviders(<ReleaseBrowsePage />);

    expect(mockUseSearchReleasesQuery).toHaveBeenCalledWith(expect.anything(), {
      skip: true
    });
    expect(mockUseSearchReleaseGroupsQuery).toHaveBeenCalledWith(
      expect.anything(),
      { skip: false }
    );
  });

  // The reconciliation is the point of the whole toggle: /search/release-groups
  // rejects consumers/contributors/random with a 400, so a value carried across
  // from the release search must be replaced, not sent.
  it.each(['consumers', 'contributors', 'random'])(
    'replaces the release-only orderBy %s with the group default rather than sending it',
    (bad) => {
      inGroupMode(`&orderBy=${bad}`);
      mockUseSearchReleaseGroupsQuery.mockReturnValue(groupBody([]));
      renderWithProviders(<ReleaseBrowsePage />);

      expect(mockUseSearchReleaseGroupsQuery).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: 'title' }),
        { skip: false }
      );
      expect(mockUseSearchReleaseGroupsQuery).not.toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: bad }),
        expect.anything()
      );
    }
  );

  it('keeps an orderBy both endpoints accept', () => {
    inGroupMode('&orderBy=year');
    mockUseSearchReleaseGroupsQuery.mockReturnValue(groupBody([]));
    renderWithProviders(<ReleaseBrowsePage />);
    expect(mockUseSearchReleaseGroupsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: 'year' }),
      { skip: false }
    );
  });

  it('counts albums rather than results, and lists the members the viewer can reach', () => {
    inGroupMode();
    mockUseSearchReleaseGroupsQuery.mockReturnValue(
      groupBody(
        [
          {
            id: 3,
            title: 'Kid A',
            year: 2000,
            image: null,
            artist: { id: 1, name: 'Radiohead' },
            releases: [
              {
                id: 41,
                title: 'Kid A',
                year: 2000,
                image: null,
                communityId: 2,
                community: { id: 2, name: 'Hydra' },
                artist: { id: 1, name: 'Radiohead' }
              },
              {
                id: 87,
                title: 'Kid A',
                year: 2000,
                image: null,
                communityId: 7,
                community: { id: 7, name: 'Tapehead' },
                artist: { id: 1, name: 'Radiohead' }
              }
            ]
          }
        ],
        12
      )
    );
    renderWithProviders(<ReleaseBrowsePage />);

    // The row IS the group, so the count is albums — not releases.
    expect(screen.getByText('12 albums')).toBeInTheDocument();
    expect(screen.queryByText('12 results')).not.toBeInTheDocument();

    expect(screen.getByText('Kid A')).toBeInTheDocument();
    expect(screen.getByText('Hydra')).toBeInTheDocument();
    expect(screen.getByText('Tapehead')).toBeInTheDocument();
  });

  // Zero in group mode does not mean the filters matched nothing — grouping is
  // opt-in and never backfilled, so on an uncurated catalogue EVERY group query
  // is empty. The shared copy would be wrong for the majority of queries.
  it('names the cause of an empty group search and offers the way back', () => {
    inGroupMode('&q=radiohead');
    mockUseSearchReleaseGroupsQuery.mockReturnValue(groupBody([]));
    renderWithProviders(<ReleaseBrowsePage />);

    expect(screen.getByText(/no grouped albums match/i)).toBeInTheDocument();
    expect(screen.queryByText('No releases found.')).not.toBeInTheDocument();
    expect(screen.getByText(/grouping is opt-in/i)).toBeInTheDocument();

    // The way back keeps the filters and drops the mode and its sort.
    const back = screen
      .getByText(/see these filters as releases/i)
      .closest('a');
    expect(back?.getAttribute('href')).toContain('q=radiohead');
    expect(back?.getAttribute('href')).not.toContain('mode=groups');
  });

  it('keeps the plain empty copy in release mode', () => {
    mockUseSearchReleasesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 25, totalPages: 0 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleaseBrowsePage />);
    expect(screen.getByText('No releases found.')).toBeInTheDocument();
    expect(screen.queryByText(/grouping is opt-in/i)).not.toBeInTheDocument();
  });

  it('offers only the sort options the active mode accepts', () => {
    inGroupMode();
    mockUseSearchReleaseGroupsQuery.mockReturnValue(groupBody([]));
    renderWithProviders(<ReleaseBrowsePage />);
    const options = [
      ...(document.querySelectorAll(
        '#release-orderBy option'
      ) as NodeListOf<HTMLOptionElement>)
    ].map((o) => o.value);
    expect(options).toEqual(['title', 'year', 'createdAt']);
  });
});
