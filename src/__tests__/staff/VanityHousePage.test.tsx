import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import VanityHousePage from '../../components/staff/VanityHousePage';

const mockQuery = jest.fn();
const mockSet = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetVanityHouseArtistsQuery: () => mockQuery(),
  useSetVanityHouseMutation: () => [mockSet, { isLoading: false }]
}));

const artist = { id: 7, name: 'Phantom', _count: { releases: 4 } };

describe('VanityHousePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSet.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('renders artists on the grid table', () => {
    mockQuery.mockReturnValue({
      data: { data: [artist], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<VanityHousePage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('Phantom')).toBeInTheDocument();
  });

  it('rejects an invalid artist ID', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<VanityHousePage />);
    await user.click(screen.getByRole('button', { name: 'Add Artist' }));
    expect(screen.getByText('Enter a valid artist ID.')).toBeInTheDocument();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('adds a valid artist ID', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<VanityHousePage />);
    await user.type(screen.getByPlaceholderText('Artist ID'), '42');
    await user.click(screen.getByRole('button', { name: 'Add Artist' }));
    expect(mockSet).toHaveBeenCalledWith({ id: 42, vanityHouse: true });
  });

  it('removes an artist', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [artist], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<VanityHousePage />);
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mockSet).toHaveBeenCalledWith({ id: 7, vanityHouse: false });
  });
});
