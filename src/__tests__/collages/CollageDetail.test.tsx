import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import CollageDetail from '../../components/collages/CollageDetail';

const mockUseGetCollageQuery = jest.fn();
const mockDeleteCollage = jest.fn();
const mockSubscribeCollage = jest.fn();
const mockBookmarkCollage = jest.fn();
const mockAddCollageEntry = jest.fn();
const mockRemoveCollageEntry = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../components/layout/CommentsSection', () => {
  const MockCommentsSection = () => <div>CommentsSection</div>;
  MockCommentsSection.displayName = 'MockCommentsSection';
  return MockCommentsSection;
});

jest.mock('../../store/services/collageApi', () => ({
  useGetCollageQuery: (...args: unknown[]) => mockUseGetCollageQuery(...args),
  useDeleteCollageMutation: () => [mockDeleteCollage],
  useSubscribeCollageMutation: () => [mockSubscribeCollage],
  useBookmarkCollageMutation: () => [mockBookmarkCollage],
  useAddCollageEntryMutation: () => [mockAddCollageEntry],
  useRemoveCollageEntryMutation: () => [mockRemoveCollageEntry]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '8' }),
  useNavigate: () => mockNavigate
}));

describe('CollageDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        name: 'Synth Pop',
        categoryId: 1,
        isLocked: false,
        isDeleted: false,
        isSubscribed: false,
        isBookmarked: false,
        numEntries: 1,
        numSubscribers: 4,
        description: 'A collage',
        tags: ['electronic'],
        user: { username: 'alice' },
        entries: [
          {
            id: 1,
            releaseId: 55,
            userId: 7,
            user: { username: 'alice' },
            release: {
              title: 'Release',
              image: null,
              communityId: 2,
              artist: { name: 'Artist' }
            }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    mockDeleteCollage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockSubscribeCollage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockBookmarkCollage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockAddCollageEntry.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockRemoveCollageEntry.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('lets the owner subscribe, bookmark, add, remove, and delete', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );

    renderWithProviders(<CollageDetail />, { store });

    await user.click(screen.getByRole('button', { name: /^subscribe$/i }));
    await user.click(screen.getByRole('button', { name: /^bookmark$/i }));
    await user.type(screen.getByPlaceholderText(/release id/i), '77');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await user.click(screen.getByRole('button', { name: /\[x\]/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockSubscribeCollage).toHaveBeenCalledWith(8);
      expect(mockBookmarkCollage).toHaveBeenCalledWith(8);
      expect(mockAddCollageEntry).toHaveBeenCalledWith({
        id: 8,
        releaseId: 77
      });
      expect(mockRemoveCollageEntry).toHaveBeenCalledWith({
        id: 8,
        releaseId: 55
      });
      expect(mockDeleteCollage).toHaveBeenCalledWith(8);
      expect(mockNavigate).toHaveBeenCalledWith('/private/collages');
    });
  });
});
