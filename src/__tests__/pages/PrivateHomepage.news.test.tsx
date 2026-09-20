import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createTestStore } from '../testUtils';
import PrivateHomepage from '../../components/pages/private/PrivateHomepage';
import { setCredentials } from '../../store/slices/authSlice';

/**
 * Addressable news anchors (#348), driven through the mounted homepage rather
 * than NewsPanel alone — a spec that renders the panel in isolation cannot
 * prove a `news.xml` link reaching `/` finds anything.
 *
 * The api publishes 50 items in the feed and five on the homepage's combined
 * payload, which is why the panel pages (stellar-api#670): a fragment naming
 * an older item has to be able to reach it.
 */

const mockUseGetNewsQuery = jest.fn();
const mockScrollIntoView = jest.fn();

jest.mock('../../store/services/announcementApi', () => ({
  useGetAnnouncementsQuery: () => ({
    data: { announcements: [], blogPosts: [] },
    isLoading: false
  }),
  useGetNewsQuery: (...args: unknown[]) => mockUseGetNewsQuery(...args)
}));

jest.mock('../../store/services/homeApi', () => ({
  useGetHomepageFeaturedQuery: () => ({
    data: { albumOfTheMonth: null, vanityHouse: null }
  })
}));

jest.mock('../../store/services/siteApi', () => ({
  useGetSiteStatsQuery: () => ({ data: {} })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const item = (id: number, title: string) => ({
  id,
  title,
  body: `<p>Body of ${title}</p>`,
  createdAt: '2026-01-01T00:00:00Z'
});

const page = (items: ReturnType<typeof item>[], total = items.length) => ({
  data: { data: items, meta: { total, page: 1, limit: 5, totalPages: 1 } },
  isLoading: false
});

const FIVE = [1, 2, 3, 4, 5].map((n) => item(n, `News ${n}`));

const render = (hash = '') => {
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: 1,
      username: 'jazzfan',
      avatar: null,
      userRank: { level: 100, name: 'User', color: '#fff' }
    })
  );
  return renderWithProviders(<PrivateHomepage />, {
    store,
    initialEntries: [`/${hash}`]
  });
};

beforeEach(() => {
  mockUseGetNewsQuery.mockReset().mockReturnValue(page(FIVE, 5));
  mockScrollIntoView.mockReset();
  // jsdom implements neither; assigning lets the spec assert they were called.
  Element.prototype.scrollIntoView = mockScrollIntoView;
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
});

describe('news anchors (#348)', () => {
  it('gives every item an addressable id', () => {
    render();
    for (const n of [1, 2, 3, 4, 5]) {
      expect(document.getElementById(`news-${n}`)).toBeInTheDocument();
    }
  });

  it('asks for the resting five when no fragment names an item', () => {
    render();
    expect(mockUseGetNewsQuery).toHaveBeenCalledWith({ page: 1, limit: 5 });
  });
});

describe('arriving from a feed link (#348)', () => {
  it('scrolls the named item into view', async () => {
    render('#news-3');
    await waitFor(() => expect(mockScrollIntoView).toHaveBeenCalled());
    expect(mockScrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'center' })
    );
  });

  it('expands it, so the reader sees what their feed reader showed them', async () => {
    render('#news-3');
    expect(await screen.findByText('Body of News 3')).toBeInTheDocument();
    expect(screen.queryByText('Body of News 2')).not.toBeInTheDocument();
  });

  it('focuses it, so assistive tech announces the arrival', async () => {
    render('#news-3');
    await waitFor(() =>
      expect(document.activeElement).toBe(document.getElementById('news-3'))
    );
  });

  it('highlights it, then lets the highlight fade', async () => {
    jest.useFakeTimers();
    try {
      render('#news-3');
      await waitFor(() =>
        expect(document.getElementById('news-3')?.className).toContain(
          'st-fill-hover'
        )
      );
      jest.advanceTimersByTime(2000);
      await waitFor(() =>
        expect(document.getElementById('news-3')?.className).not.toContain(
          'st-fill-hover'
        )
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('honours a reduced-motion preference, which the CSS block does not cover', async () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    render('#news-3');
    await waitFor(() => expect(mockScrollIntoView).toHaveBeenCalled());
    expect(mockScrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' })
    );
  });

  it('ignores a fragment that is not a news anchor', () => {
    render('#some-other-thing');
    expect(mockUseGetNewsQuery).toHaveBeenCalledWith({ page: 1, limit: 5 });
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });
});

describe('reaching an older item (#348)', () => {
  it('asks for the feed’s whole reach when a fragment names an item', () => {
    render('#news-42');
    expect(mockUseGetNewsQuery).toHaveBeenCalledWith({ page: 1, limit: 50 });
  });

  it('finds an item well past the resting five', async () => {
    const deep = [...FIVE, item(42, 'News 42')];
    mockUseGetNewsQuery.mockReturnValue(page(deep, 50));
    render('#news-42');
    expect(await screen.findByText('Body of News 42')).toBeInTheDocument();
  });

  it('says so when the item is not there, rather than failing silently', async () => {
    mockUseGetNewsQuery.mockReturnValue(page(FIVE, 5));
    render('#news-999');
    expect(
      await screen.findByText(/no longer shown here/i)
    ).toBeInTheDocument();
  });

  it('says nothing when the item was found', () => {
    render('#news-3');
    expect(screen.queryByText(/no longer shown here/i)).not.toBeInTheDocument();
  });
});

describe('load more news (#348)', () => {
  it('offers the control only while the server holds more', () => {
    mockUseGetNewsQuery.mockReturnValue(page(FIVE, 5));
    render();
    expect(
      screen.queryByRole('button', { name: /load more news/i })
    ).not.toBeInTheDocument();
  });

  it('shows it when more exist, and raises the request', async () => {
    const user = userEvent.setup();
    mockUseGetNewsQuery.mockReturnValue(page(FIVE, 30));
    render();

    await user.click(screen.getByRole('button', { name: /load more news/i }));

    expect(mockUseGetNewsQuery).toHaveBeenLastCalledWith({
      page: 1,
      limit: 15
    });
  });
});
