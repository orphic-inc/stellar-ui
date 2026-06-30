import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import AlbumOfMonthPage from '../../components/staff/AlbumOfMonthPage';

const mockQuery = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../store/services/adminApi', () => ({
  useGetAlbumOfMonthQuery: () => mockQuery(),
  useCreateAlbumOfMonthMutation: () => [mockCreate, { isLoading: false }],
  useDeleteAlbumOfMonthMutation: () => [mockDelete, { isLoading: false }]
}));

const makeAlbum = (id: number) => ({
  id,
  title: `Album ${id}`,
  groupId: 100 + id,
  threadId: 200 + id,
  started: '2026-01-01T00:00:00.000Z',
  ended: '2026-02-01T00:00:00.000Z'
});

describe('AlbumOfMonthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows a spinner while loading', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<AlbumOfMonthPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<AlbumOfMonthPage />);
    expect(screen.getByText('No albums on record.')).toBeInTheDocument();
  });

  it('renders albums on the grid table (kit hooks present)', () => {
    mockQuery.mockReturnValue({
      data: [makeAlbum(1), makeAlbum(2)],
      isLoading: false
    });
    renderWithProviders(<AlbumOfMonthPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('Album 1')).toBeInTheDocument();
    expect(screen.getByText('Album 2')).toBeInTheDocument();
  });

  it('validates that IDs must be positive integers', async () => {
    mockQuery.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<AlbumOfMonthPage />);
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(
      screen.getByText(/group id and thread id must be positive integers/i)
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('deletes an album via the Delete action', async () => {
    mockQuery.mockReturnValue({ data: [makeAlbum(3)], isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<AlbumOfMonthPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDelete).toHaveBeenCalledWith(3);
  });
});
