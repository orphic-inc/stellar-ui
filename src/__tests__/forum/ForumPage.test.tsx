import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ForumPage from '../../components/forum/ForumPage';

const mockUseGetForumByIdQuery = jest.fn();
const mockUseGetTopicsByForumQuery = jest.fn();

jest.mock('../../store/services/forumApi', () => ({
  useGetForumByIdQuery: (...args: unknown[]) =>
    mockUseGetForumByIdQuery(...args),
  useGetTopicsByForumQuery: (...args: unknown[]) =>
    mockUseGetTopicsByForumQuery(...args)
}));

let mockForumId: string | undefined = '9';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ forumId: mockForumId })
}));

describe('ForumPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForumId = '9';
    mockUseGetForumByIdQuery.mockReturnValue({
      data: {
        id: 9,
        name: 'Jazz Forum',
        forumCategory: { id: 1, name: 'Music' }
      },
      isLoading: false,
      error: undefined
    });
    mockUseGetTopicsByForumQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 44,
            title: 'Favorite labels',
            isLocked: true,
            isSticky: true,
            numPosts: 7,
            author: { username: 'alice' },
            lastPost: { createdAt: '2026-05-17T12:00:00.000Z' }
          }
        ],
        meta: { totalPages: 2 }
      },
      isLoading: false
    });
  });

  it('renders topics and paginates through the forum query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForumPage />);

    expect(mockUseGetTopicsByForumQuery).toHaveBeenCalledWith({
      forumId: 9,
      page: 1
    });
    expect(screen.getByRole('link', { name: /\+ new topic/i })).toHaveAttribute(
      'href',
      '/private/forums/9/new'
    );
    expect(
      screen.getByRole('link', { name: 'Favorite labels' })
    ).toHaveAttribute('href', '/private/forums/9/topics/44');
    expect(screen.getByText('[Locked]')).toBeInTheDocument();
    expect(screen.getByText('[Sticky]')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(mockUseGetTopicsByForumQuery).toHaveBeenLastCalledWith({
      forumId: 9,
      page: 2
    });

    await user.click(screen.getByRole('button', { name: /prev/i }));

    expect(mockUseGetTopicsByForumQuery).toHaveBeenLastCalledWith({
      forumId: 9,
      page: 1
    });
  });

  it('renders spinner when forumLoading is true', () => {
    mockUseGetForumByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ForumPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders topics with isSticky=false (covers non-sticky row class)', () => {
    mockUseGetTopicsByForumQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 55,
            title: 'Regular topic',
            isLocked: false,
            isSticky: false,
            numPosts: 3,
            author: { username: 'bob' },
            lastPost: { createdAt: '2026-05-17T12:00:00.000Z' }
          }
        ],
        meta: { totalPages: 1 }
      },
      isLoading: false
    });
    renderWithProviders(<ForumPage />);
    expect(screen.getByRole('link', { name: 'Regular topic' })).toBeInTheDocument();
    expect(screen.queryByText('[Locked]')).not.toBeInTheDocument();
  });

  it('uses forumId 0 when param is undefined', () => {
    mockForumId = undefined;
    mockUseGetForumByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    renderWithProviders(<ForumPage />);
    expect(screen.getByText('Forum not found.')).toBeInTheDocument();
  });

  it('shows empty and missing-forum states', () => {
    mockUseGetTopicsByForumQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });

    const { rerender } = renderWithProviders(<ForumPage />);

    expect(screen.getByText('No topics yet.')).toBeInTheDocument();

    mockUseGetForumByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });

    rerender(<ForumPage />);

    expect(screen.getByText('Forum not found.')).toBeInTheDocument();
  });
});
