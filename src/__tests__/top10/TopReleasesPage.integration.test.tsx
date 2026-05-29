import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopReleasesPage from '../../components/top10/TopReleasesPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

const makeItem = (id: number) => ({
  rank: id,
  releaseId: id,
  title: `Release ${id}`,
  year: 2020,
  artistId: id,
  artistName: `Artist ${id}`,
  type: 'Music',
  releaseType: 'Album',
  tags: [{ id: 1, name: 'jazz' }],
  consumerCount: id * 10,
  totalBytesConsumed: String(1073741824 * id),
  contributionCount: id * 2
});

describe('TopReleasesPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('loads top releases and sends real query params when filters change', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementation((request: Request) => {
      const url = new URL(request.url, 'http://localhost');

      if (url.pathname === '/api/top10/releases') {
        const type = url.searchParams.get('type') ?? 'day';
        const limit = url.searchParams.get('limit') ?? '10';
        const excludeTags = url.searchParams.get('excludeTags') ?? '';
        const format = url.searchParams.get('format') ?? '';

        return Promise.resolve(
          makeResponse({
            body: {
              items:
                type === 'week' &&
                limit === '100' &&
                excludeTags === 'ambient' &&
                format === 'flac'
                  ? [makeItem(7)]
                  : [makeItem(1), makeItem(2)]
            }
          })
        );
      }

      return Promise.resolve(
        makeResponse({
          status: 404,
          body: { msg: `Unhandled request: ${request.method} ${url.pathname}` }
        })
      );
    });

    renderWithProviders(<TopReleasesPage />);

    expect(
      await screen.findByRole('link', { name: /artist 1 – release 1/i })
    ).toBeInTheDocument();

    const fetchMock = global.fetch as jest.Mock;
    const initialRequest = fetchMock.mock.calls[0][0] as Request;
    expect(initialRequest.url).toContain(
      '/api/top10/releases?type=overall&limit=10'
    );
    expect(initialRequest.method).toBe('GET');

    await user.selectOptions(
      screen.getByRole('combobox', { name: /period \/ type/i }),
      'week'
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /^limit$/i }),
      '100'
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /^format$/i }),
      'flac'
    );
    await user.type(
      screen.getByPlaceholderText(/e\.g\. pop, rock/i),
      'ambient'
    );
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(
      await screen.findByRole('link', { name: /artist 7 – release 7/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      const requests = (global.fetch as jest.Mock).mock.calls.map(
        (call) => call[0] as Request
      );
      expect(
        requests.some((request) => {
          const url = new URL(request.url, 'http://localhost');
          return (
            url.pathname === '/api/top10/releases' &&
            url.searchParams.get('type') === 'week' &&
            url.searchParams.get('limit') === '100' &&
            url.searchParams.get('format') === 'flac' &&
            url.searchParams.get('excludeTags') === 'ambient'
          );
        })
      ).toBe(true);
    });
  });

  it('renders real empty and error states from the top releases query', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({
        body: { items: [] }
      })
    );

    const { unmount } = renderWithProviders(<TopReleasesPage />);

    expect(
      await screen.findByText(/no data for this period/i)
    ).toBeInTheDocument();

    unmount();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({
        status: 500,
        body: { msg: 'boom' }
      })
    );

    renderWithProviders(<TopReleasesPage />);

    expect(
      await screen.findByText(/failed to load top releases/i)
    ).toBeInTheDocument();
  });
});
