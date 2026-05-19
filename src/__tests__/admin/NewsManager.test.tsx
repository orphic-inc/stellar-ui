import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NewsManager from '../../components/admin/NewsManager';

const mockGetAnnouncementsQuery = jest.fn();
const mockCreateAnnouncement = jest.fn();
const mockDeleteAnnouncement = jest.fn();
const mockCreateBlogPost = jest.fn();
const mockDeleteBlogPost = jest.fn();

let mockCreatingNews = false;
let mockCreatingBlog = false;

jest.mock('../../store/services/announcementApi', () => ({
  useGetAnnouncementsQuery: () => mockGetAnnouncementsQuery(),
  useCreateAnnouncementMutation: () => [
    mockCreateAnnouncement,
    { isLoading: mockCreatingNews }
  ],
  useDeleteAnnouncementMutation: () => [mockDeleteAnnouncement],
  useCreateBlogPostMutation: () => [
    mockCreateBlogPost,
    { isLoading: mockCreatingBlog }
  ],
  useDeleteBlogPostMutation: () => [mockDeleteBlogPost]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
}));

const emptyData = { announcements: [], blogPosts: [] };

describe('NewsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatingNews = false;
    mockCreatingBlog = false;
    mockCreateAnnouncement.mockResolvedValue({});
    mockCreateBlogPost.mockResolvedValue({});
  });

  it('shows spinner while loading', () => {
    mockGetAnnouncementsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error messages on failure', () => {
    mockGetAnnouncementsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<NewsManager />);
    expect(
      screen.getByText(/failed to load announcements/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/failed to load blog posts/i)).toBeInTheDocument();
  });

  it('shows empty state rows when no data', () => {
    mockGetAnnouncementsQuery.mockReturnValue({
      data: emptyData,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    expect(screen.getByText(/no announcements/i)).toBeInTheDocument();
    expect(screen.getByText(/no blog posts/i)).toBeInTheDocument();
  });

  it('renders announcement titles and delete buttons', () => {
    mockGetAnnouncementsQuery.mockReturnValue({
      data: {
        announcements: [
          { id: 1, title: 'Site launch', createdAt: '2026-01-01T00:00:00Z' }
        ],
        blogPosts: []
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    expect(screen.getByText('Site launch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls deleteAnnouncement on Delete click', async () => {
    const user = userEvent.setup();
    mockGetAnnouncementsQuery.mockReturnValue({
      data: {
        announcements: [
          { id: 5, title: 'Old news', createdAt: '2026-01-01T00:00:00Z' }
        ],
        blogPosts: []
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDeleteAnnouncement).toHaveBeenCalledWith(5);
  });

  it('submits announcement form with title and body', async () => {
    const user = userEvent.setup();
    mockGetAnnouncementsQuery.mockReturnValue({
      data: emptyData,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    const [announcementTitle] = screen.getAllByPlaceholderText('Title');
    const [announcementBody] = screen.getAllByPlaceholderText('Body');
    await user.type(announcementTitle, 'Important Update');
    await user.type(announcementBody, 'Details here.');
    await user.click(
      screen.getByRole('button', { name: /post announcement/i })
    );
    expect(mockCreateAnnouncement).toHaveBeenCalledWith({
      title: 'Important Update',
      body: 'Details here.'
    });
  });

  it('renders blog post title and author', () => {
    mockGetAnnouncementsQuery.mockReturnValue({
      data: {
        announcements: [],
        blogPosts: [
          {
            id: 2,
            title: 'Staff Reflections',
            createdAt: '2026-02-01T00:00:00Z',
            user: { username: 'admin' }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    expect(screen.getByText('Staff Reflections')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('calls deleteBlogPost when Delete button is clicked', async () => {
    const user = userEvent.setup();
    mockGetAnnouncementsQuery.mockReturnValue({
      data: {
        announcements: [],
        blogPosts: [
          {
            id: 5,
            title: 'Old Post',
            createdAt: '2026-03-01T00:00:00Z',
            user: { username: 'admin' }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(mockDeleteBlogPost).toHaveBeenCalledWith(5);
  });

  it('submits blog post form with title and body', async () => {
    const user = userEvent.setup();
    mockGetAnnouncementsQuery.mockReturnValue({
      data: emptyData,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    const [, blogTitle] = screen.getAllByPlaceholderText('Title');
    const [, blogBody] = screen.getAllByPlaceholderText('Body');
    await user.type(blogTitle, 'Monthly Update');
    await user.type(blogBody, 'Content here.');
    await user.click(screen.getByRole('button', { name: /post blog entry/i }));
    expect(mockCreateBlogPost).toHaveBeenCalledWith({
      title: 'Monthly Update',
      body: 'Content here.'
    });
  });

  it('shows "Posting…" when creatingNews is true', () => {
    mockCreatingNews = true;
    mockGetAnnouncementsQuery.mockReturnValue({
      data: emptyData,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    expect(
      screen.getByRole('button', { name: /posting…/i })
    ).toBeInTheDocument();
  });

  it('shows "Posting…" for blog when creatingBlog is true', () => {
    mockCreatingBlog = true;
    mockGetAnnouncementsQuery.mockReturnValue({
      data: emptyData,
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    expect(
      screen.getAllByRole('button', { name: /posting…/i }).length
    ).toBeGreaterThan(0);
  });

  it('shows dash when blog post has no user', () => {
    mockGetAnnouncementsQuery.mockReturnValue({
      data: {
        announcements: [],
        blogPosts: [
          {
            id: 9,
            title: 'Anonymous',
            createdAt: '2026-04-01T00:00:00Z',
            user: null
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<NewsManager />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
