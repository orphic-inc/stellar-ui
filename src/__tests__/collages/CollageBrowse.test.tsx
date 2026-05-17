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
