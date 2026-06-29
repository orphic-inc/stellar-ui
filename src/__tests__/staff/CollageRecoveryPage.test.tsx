import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CollageRecoveryPage from '../../components/staff/CollageRecoveryPage';

const mockQuery = jest.fn();
const mockRecover = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetDeletedCollagesQuery: () => mockQuery()
}));
jest.mock('../../store/services/collageApi', () => ({
  useRecoverCollageMutation: () => [mockRecover, { isLoading: false }]
}));

const collage = {
  id: 5,
  name: 'Best Of 2025',
  user: { id: 2, username: 'curator' },
  createdAt: '2026-01-02T00:00:00.000Z',
  deletedAt: '2026-02-02T00:00:00.000Z'
};

describe('CollageRecoveryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecover.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('renders deleted collages on the grid table', () => {
    mockQuery.mockReturnValue({
      data: { data: [collage], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<CollageRecoveryPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('Best Of 2025')).toBeInTheDocument();
  });

  it('recovers a collage', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [collage], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<CollageRecoveryPage />);
    await user.click(screen.getByRole('button', { name: 'Recover' }));
    expect(mockRecover).toHaveBeenCalledWith(5);
  });
});
