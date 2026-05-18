import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders, createTestStore } from '../testUtils';
import PrivateHomepage from '../../components/pages/private/PrivateHomepage';
import { setCredentials } from '../../store/slices/authSlice';

const mockUseGetAnnouncementsQuery = jest.fn();
const mockUseGetHomepageFeaturedQuery = jest.fn();
const mockUseGetSiteStatsQuery = jest.fn();

jest.mock('../../store/services/announcementApi', () => ({
  useGetAnnouncementsQuery: () => mockUseGetAnnouncementsQuery()
}));

jest.mock('../../store/services/homeApi', () => ({
  useGetHomepageFeaturedQuery: () => mockUseGetHomepageFeaturedQuery()
}));

jest.mock('../../store/services/siteApi', () => ({
  useGetSiteStatsQuery: () => mockUseGetSiteStatsQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({
    to,
    children
  }: {
    to: string;
    children: React.ReactNode;
  }) => <a href={to}>{children}</a>
}));

const mockUser = {
  id: 1,
  username: 'jazzfan',
  avatar: null,
  userRank: { level: 100, name: 'User', color: '#fff' }
};

const renderWithUser = () => {
  const store = createTestStore();
  store.dispatch(setCredentials(mockUser));
  return renderWithProviders(<PrivateHomepage />, { store });
};

const emptyAnnouncements = { announcements: [], blogPosts: [] };
const emptyFeatured = { albumOfTheMonth: null, vanityHouse: null };
const emptyStats = {};

describe('PrivateHomepage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetAnnouncementsQuery.mockReturnValue({
      data: emptyAnnouncements,
      isLoading: false
    });
    mockUseGetHomepageFeaturedQuery.mockReturnValue({ data: emptyFeatured });
    mockUseGetSiteStatsQuery.mockReturnValue({ data: emptyStats });
  });

  it('shows username in welcome heading', () => {
    renderWithUser();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText('jazzfan')).toBeInTheDocument();
  });

  it('shows spinner in announcements section while loading', () => {
    mockUseGetAnnouncementsQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithUser();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no announcements', () => {
    renderWithUser();
    expect(screen.getByText(/no announcements/i)).toBeInTheDocument();
  });

  it('renders announcement titles', () => {
    mockUseGetAnnouncementsQuery.mockReturnValue({
      data: {
        announcements: [
          { id: 1, title: 'Site Update', createdAt: '2026-01-01T00:00:00Z' }
        ],
        blogPosts: []
      },
      isLoading: false
    });
    renderWithUser();
    expect(screen.getByText('Site Update')).toBeInTheDocument();
  });

  it('shows empty state when no blog posts', () => {
    renderWithUser();
    expect(screen.getByText(/no blog posts/i)).toBeInTheDocument();
  });

  it('renders blog post title and author', () => {
    mockUseGetAnnouncementsQuery.mockReturnValue({
      data: {
        announcements: [],
        blogPosts: [
          {
            id: 1,
            title: 'Jazz Deep Dive',
            createdAt: '2026-01-01T00:00:00Z',
            user: { id: 2, username: 'editor' }
          }
        ]
      },
      isLoading: false
    });
    renderWithUser();
    expect(screen.getByText('Jazz Deep Dive')).toBeInTheDocument();
    expect(screen.getByText(/editor/)).toBeInTheDocument();
  });

  it('renders site stats', () => {
    mockUseGetSiteStatsQuery.mockReturnValue({
      data: { totalUsers: 42, releases: 100 }
    });
    renderWithUser();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows "Not set." when album of the month is absent', () => {
    renderWithUser();
    expect(screen.getAllByText('Not set.').length).toBeGreaterThan(0);
  });

  it('renders album of the month with title and artist', () => {
    mockUseGetHomepageFeaturedQuery.mockReturnValue({
      data: {
        albumOfTheMonth: {
          id: 1,
          title: 'Kind of Blue',
          release: {
            id: 10,
            communityId: 1,
            image: null,
            artist: { name: 'Miles Davis' },
            year: 1959
          }
        },
        vanityHouse: null
      }
    });
    renderWithUser();
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText(/miles davis/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view release/i })).toBeInTheDocument();
  });

  it('renders vanity house release', () => {
    mockUseGetHomepageFeaturedQuery.mockReturnValue({
      data: {
        albumOfTheMonth: null,
        vanityHouse: {
          id: 20,
          communityId: 2,
          title: 'VH Album',
          image: null,
          year: 2020,
          artist: { name: 'VH Artist' }
        }
      }
    });
    renderWithUser();
    expect(screen.getByText('VH Album')).toBeInTheDocument();
    expect(screen.getByText(/vh artist/i)).toBeInTheDocument();
  });
});
