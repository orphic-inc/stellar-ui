import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CollageBrowse from '../../components/collages/CollageBrowse';

const mockUseListCollagesQuery = jest.fn();

jest.mock('../../store/services/collageApi', () => ({
  useListCollagesQuery: (...args: unknown[]) =>
    mockUseListCollagesQuery(...args)
}));

describe('CollageBrowse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseListCollagesQuery.mockImplementation((_params) => ({
      data: {
        data: [
          {
            id: 1,
            name: 'Synth Pop',
            description: 'A collage',
            tags: ['electronic'],
            isLocked: true,
            numEntries: 12,
            numSubscribers: 3,
            user: { username: 'alice' }
          }
        ],
        meta: { totalPages: 3 }
      },
      isLoading: false,
      error: undefined
    }));
  });

  it('renders a spinner while loading', () => {
    mockUseListCollagesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<CollageBrowse />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders error message on failure', () => {
    mockUseListCollagesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<CollageBrowse />);
    expect(screen.getByText(/failed to load collages/i)).toBeInTheDocument();
  });

  it('advances to next page and returns via previous', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CollageBrowse />);

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(mockUseListCollagesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );

    await user.click(screen.getByRole('button', { name: /^prev$/i }));
    expect(mockUseListCollagesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('handles data present but data.data undefined (falls back to empty array)', () => {
    mockUseListCollagesQuery.mockReturnValue({
      data: { meta: { totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageBrowse />);
    expect(screen.getByText(/no collages found/i)).toBeInTheDocument();
  });

  it('shows empty state when no collages are returned', () => {
    mockUseListCollagesQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageBrowse />);
    expect(screen.getByText(/no collages found/i)).toBeInTheDocument();
  });

  it('renders em-dash when collage has no user', () => {
    mockUseListCollagesQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 2,
            name: 'No Author',
            description: '',
            tags: [],
            isLocked: false,
            numEntries: 0,
            numSubscribers: 0,
            user: null
          }
        ],
        meta: { totalPages: 1 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageBrowse />);
    expect(screen.getByText(/by —/)).toBeInTheDocument();
  });

  it('passes search/category/sort changes through to the query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CollageBrowse />);

    await user.type(screen.getByPlaceholderText(/search collages/i), 'synth');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    await user.click(screen.getByRole('button', { name: /discography/i }));
    await user.selectOptions(screen.getByRole('combobox'), 'numSubscribers');

    expect(mockUseListCollagesQuery).toHaveBeenLastCalledWith({
      page: 1,
      search: 'synth',
      categoryId: 2,
      orderBy: 'numSubscribers',
      order: 'desc'
    });
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });
});
