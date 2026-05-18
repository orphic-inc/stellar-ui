import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ForumControlPanel from '../../components/admin/ForumControlPanel';

const mockGetForumCategoriesQuery = jest.fn();
const mockGetForumsQuery = jest.fn();
const mockCreateForum = jest.fn();

jest.mock('../../store/services/forumApi', () => ({
  useGetForumCategoriesQuery: () => mockGetForumCategoriesQuery(),
  useGetForumsQuery: () => mockGetForumsQuery(),
  useCreateForumMutation: () => [mockCreateForum, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const categories = [
  { id: 1, name: 'General', sort: 1 },
  { id: 2, name: 'Music Talk', sort: 2 }
];

const forums = [
  {
    id: 10,
    name: 'Site News',
    sort: 1,
    numTopics: 5,
    numPosts: 20,
    forumCategory: { name: 'General' }
  }
];

describe('ForumControlPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForumCategoriesQuery.mockReturnValue({
      data: categories,
      isLoading: false,
      error: undefined
    });
    mockGetForumsQuery.mockReturnValue({
      data: forums,
      isLoading: false,
      error: undefined
    });
    mockCreateForum.mockResolvedValue({ data: { id: 11 } });
  });

  it('shows spinner while loading', () => {
    mockGetForumCategoriesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ForumControlPanel />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when load fails', () => {
    mockGetForumsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByText(/failed to load forums/i)).toBeInTheDocument();
  });

  it('renders existing forum in table', () => {
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByRole('link', { name: 'Site News' })).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
  });

  it('shows "no forums yet" empty state', () => {
    mockGetForumsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByText(/no forums yet/i)).toBeInTheDocument();
  });

  it('renders category dropdown with options', () => {
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByRole('option', { name: 'General' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Music Talk' })
    ).toBeInTheDocument();
  });

  it('calls createForum with correct payload on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForumControlPanel />);
    await user.selectOptions(screen.getByLabelText(/^category/i), 'General');
    await user.type(screen.getByLabelText(/^name/i), 'Intro Forum');
    await user.click(screen.getByRole('button', { name: /create forum/i }));
    await waitFor(() => {
      expect(mockCreateForum).toHaveBeenCalledWith(
        expect.objectContaining({
          forumCategoryId: 1,
          name: 'Intro Forum'
        })
      );
    });
  });
});
