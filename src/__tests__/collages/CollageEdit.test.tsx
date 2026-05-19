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

  it('shows spinner while loading', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<CollageEdit />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows not found when collage is absent', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: undefined,
      isLoading: false
    });
    renderWithProviders(<CollageEdit />);
    expect(screen.getByText(/collage not found/i)).toBeInTheDocument();
  });

  it('redirects non-owner non-staff to collages list', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 99,
        username: 'stranger',
        userRank: { permissions: {} }
      } as never)
    );
    renderWithProviders(<CollageEdit />, { store });
    expect(mockNavigate).toHaveBeenCalledWith('/private/collages');
  });

  it('staff user sees staff settings, submits with staff payload', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 99,
        username: 'mod',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        categoryId: 1,
        name: 'Theme Mix',
        description: 'A good description for this collage',
        tags: ['jazz'],
        isFeatured: false,
        isLocked: false,
        maxEntries: 0,
        maxEntriesPerUser: 0
      },
      isLoading: false
    });

    renderWithProviders(<CollageEdit />, { store });

    expect(screen.getByLabelText(/lock collage/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/lock collage/i));
    await user.clear(screen.getByLabelText(/max entries/i));
    await user.type(screen.getByLabelText(/max entries/i), '50');
    await user.clear(screen.getByLabelText(/max per user/i));
    await user.type(screen.getByLabelText(/max per user/i), '5');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateCollage).toHaveBeenCalledWith(
        expect.objectContaining({
          isLocked: true,
          maxEntries: 50,
          maxEntriesPerUser: 5
        })
      );
    });
  });

  it('shows specific API error message when update fails', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUpdateCollage.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Name already taken' } })
    });

    renderWithProviders(<CollageEdit />, { store });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Name already taken')).toBeInTheDocument();
    });
  });

  it('shows fallback error message when update fails with no API message', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUpdateCollage.mockReturnValue({
      unwrap: () => Promise.reject({})
    });

    renderWithProviders(<CollageEdit />, { store });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update collage.')).toBeInTheDocument();
    });
  });

  it('navigates back on cancel', async () => {
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

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/private/collages/8');
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
