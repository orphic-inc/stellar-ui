import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import LogBrowsePage from '../../components/log/LogBrowsePage';

const mockUseSearchLogQuery = jest.fn();
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/searchApi', () => ({
  useSearchLogQuery: (...args: unknown[]) => mockUseSearchLogQuery(...args)
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

const makeTopicResult = (id: number) => ({
  id,
  title: `Topic ${id}`,
  author: { id: 10, username: 'alice' },
  createdAt: '2026-05-01T00:00:00Z',
  numPosts: 3
});

const makePostResult = (id: number) => ({
  id,
  forumTopicId: 1,
  author: { id: 10, username: 'bob' },
  createdAt: '2026-05-02T00:00:00Z',
  body: `Post body ${id}`
});

describe('LogBrowsePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(),
      mockSetSearchParams
    ]);
  });

  it('shows spinner while loading', () => {
    mockUseSearchLogQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<LogBrowsePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseSearchLogQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<LogBrowsePage />);
    expect(screen.getByText(/failed to load results/i)).toBeInTheDocument();
  });

  it('renders topic results with author and post count', () => {
    mockUseSearchLogQuery.mockReturnValue({
      data: {
        data: [makeTopicResult(1)],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('type=topic'),
      mockSetSearchParams
    ]);
    renderWithProviders(<LogBrowsePage />);
    expect(screen.getByText('Topic 1')).toBeInTheDocument();
    expect(screen.getByText(/by alice/i)).toBeInTheDocument();
    expect(screen.getByText(/3 posts/i)).toBeInTheDocument();
  });

  it('renders combined topics and posts when type=all', () => {
    mockUseSearchLogQuery.mockReturnValue({
      data: {
        topics: {
          data: [makeTopicResult(1)],
          meta: { total: 1, totalPages: 1 }
        },
        posts: {
          data: [makePostResult(2)],
          meta: { total: 1, totalPages: 1 }
        }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<LogBrowsePage />);
    expect(screen.getAllByText('Topics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Posts').length).toBeGreaterThan(0);
    expect(screen.getByText('Topic 1')).toBeInTheDocument();
    expect(screen.getByText(/post by bob/i)).toBeInTheDocument();
  });

  it('updates search params on form submit', async () => {
    const user = userEvent.setup();
    mockUseSearchLogQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<LogBrowsePage />);
    await user.type(
      screen.getByPlaceholderText(/search topics and posts/i),
      'modal jazz'
    );
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('q')).toBe('modal jazz');
    expect(params.get('page')).toBe('1');
  });

  it('resets search params on Reset button click', async () => {
    const user = userEvent.setup();
    mockUseSearchLogQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<LogBrowsePage />);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.toString()).toBe('');
  });

  it('renders post results when type=post', () => {
    mockUseSearchLogQuery.mockReturnValue({
      data: {
        data: [makePostResult(5)],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('type=post'),
      mockSetSearchParams
    ]);
    renderWithProviders(<LogBrowsePage />);
    expect(screen.getByText(/post by bob/i)).toBeInTheDocument();
    expect(screen.getByText(/post body 5/i)).toBeInTheDocument();
  });

  it('renders topic pagination buttons and setPage updates page param', async () => {
    const user = userEvent.setup();
    mockUseSearchLogQuery.mockReturnValue({
      data: {
        data: [makeTopicResult(1)],
        meta: { total: 50, totalPages: 3 }
      },
      isLoading: false,
      error: undefined
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('type=topic&page=1'),
      mockSetSearchParams
    ]);
    renderWithProviders(<LogBrowsePage />);

    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));

    const params = mockSetSearchParams.mock.calls.at(
      -1
    )?.[0] as URLSearchParams;
    expect(params.get('page')).toBe('2');
  });

  it('renders post pagination and setPage updates page param', async () => {
    const user = userEvent.setup();
    mockUseSearchLogQuery.mockReturnValue({
      data: {
        data: [makePostResult(5)],
        meta: { total: 50, totalPages: 3 }
      },
      isLoading: false,
      error: undefined
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('type=post&page=1'),
      mockSetSearchParams
    ]);
    renderWithProviders(<LogBrowsePage />);

    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));

    const params = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(params.get('page')).toBe('2');
  });

  it('submits with non-default type and order, empty q (covers false/true branches)', async () => {
    const user = userEvent.setup();
    mockUseSearchLogQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<LogBrowsePage />);

    await user.click(screen.getByRole('radio', { name: /topics/i }));
    await user.selectOptions(screen.getByRole('combobox', { name: /order/i }), 'asc');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    const params = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(params.get('type')).toBe('topic');
    expect(params.get('order')).toBe('asc');
    expect(params.get('q')).toBeNull();
  });

  it('queries with parsed params from URL', () => {
    mockUseSearchLogQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('q=jazz&type=topic&order=asc&page=2'),
      mockSetSearchParams
    ]);
    renderWithProviders(<LogBrowsePage />);
    expect(mockUseSearchLogQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'jazz',
        type: 'topic',
        order: 'asc',
        page: 2
      })
    );
  });
});
