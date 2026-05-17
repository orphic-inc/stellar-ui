import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import CollageEdit from '../../components/collages/CollageEdit';

const mockUseGetCollageQuery = jest.fn();
const mockUpdateCollage = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/collageApi', () => ({
  useGetCollageQuery: (...args: unknown[]) => mockUseGetCollageQuery(...args),
  useUpdateCollageMutation: () => [mockUpdateCollage, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '8' }),
  useNavigate: () => mockNavigate
}));

describe('CollageEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        categoryId: 0,
        name: 'Personal Mix',
        description: 'Initial description',
        tags: ['one', 'two'],
        isFeatured: false,
        isLocked: false,
        maxEntries: 0,
        maxEntriesPerUser: 0
      },
      isLoading: false
    });
    mockUpdateCollage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('submits owner edits for a personal collage', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );

    renderWithProviders(<CollageEdit />, { store });

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), 'Updated Mix');
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(
      screen.getByLabelText(/description/i),
      'Updated description'
    );
    await user.clear(screen.getByLabelText(/tags/i));
    await user.type(screen.getByLabelText(/tags/i), 'alpha, beta');
    await user.click(screen.getByLabelText(/feature this collage/i));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateCollage).toHaveBeenCalledWith({
        id: 8,
        description: 'Updated description',
        tags: ['alpha', 'beta'],
        name: 'Updated Mix',
        isFeatured: true
      });
      expect(mockNavigate).toHaveBeenCalledWith('/private/collages/8');
    });
  });
});
