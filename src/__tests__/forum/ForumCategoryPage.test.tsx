import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ForumCategoryPage from '../../components/forum/ForumCategoryPage';

const mockUseGetForumCategoriesQuery = jest.fn();

jest.mock('../../store/services/forumApi', () => ({
  useGetForumCategoriesQuery: (...args: unknown[]) =>
    mockUseGetForumCategoriesQuery(...args)
}));

describe('ForumCategoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders forum categories, counts, descriptions, and latest topic links', () => {
    mockUseGetForumCategoriesQuery.mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Music',
          forums: [
            {
              id: 11,
              name: 'Jazz',
              description: 'Talk about jazz',
              numTopics: 20,
              numPosts: 88,
              lastTopic: { id: 4, title: 'Best of Blue Note' }
            },
            {
              id: 12,
              name: 'Ambient',
              description: null,
              numTopics: 0,
              numPosts: 0,
              lastTopic: null
            }
          ]
        }
      ],
      isLoading: false,
      error: undefined
    });

    renderWithProviders(<ForumCategoryPage />);

    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jazz' })).toHaveAttribute(
      'href',
      '/private/forums/11'
    );
    expect(screen.getByText('Talk about jazz')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Best of Blue Note' })
    ).toHaveAttribute('href', '/private/forums/11/topics/4');
    expect(screen.getByText('Ambient')).toBeInTheDocument();
  });

  it('shows the load failure state', () => {
    mockUseGetForumCategoriesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });

    renderWithProviders(<ForumCategoryPage />);

    expect(screen.getByText('Failed to load forums.')).toBeInTheDocument();
  });
});
