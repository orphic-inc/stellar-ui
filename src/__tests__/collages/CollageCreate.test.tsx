import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createTestStore } from '../testUtils';
import CollageCreate from '../../components/collages/CollageCreate';
import { setCredentials } from '../../store/slices/authSlice';
import type { AuthUser } from '../../types';

const mockCreateCollage = jest.fn();
const mockNavigate = jest.fn();
let mockIsLoading = false;
let mockListCollagesData:
  | { data: unknown[]; meta: { total: number } }
  | undefined = undefined;

jest.mock('../../store/services/collageApi', () => ({
  useCreateCollageMutation: () => [
    mockCreateCollage,
    { isLoading: mockIsLoading }
  ],
  useListCollagesQuery: () => ({ data: mockListCollagesData, isLoading: false })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const makeAuthUser = (personalCollageLimit: number): AuthUser => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  contributed: '0',
  consumed: '0',
  ratio: 1,
  isArtist: false,
  isDonor: false,
  canDownload: true,
  inviteCount: 0,
  dateRegistered: new Date().toISOString(),
  lastLogin: null,
  userRank: {
    level: 100,
    name: 'User',
    color: '',
    badge: '',
    permissions: {},
    personalCollageLimit
  }
});

const makeStoreWithUser = (personalCollageLimit: number) => {
  const store = createTestStore();
  store.dispatch(setCredentials(makeAuthUser(personalCollageLimit)));
  return store;
};

describe('CollageCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoading = false;
    mockListCollagesData = undefined;
    mockCreateCollage.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 88 })
    });
  });

  it('submits trimmed tags and navigates to the new collage', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CollageCreate />);

    await user.type(screen.getByLabelText(/^name$/i), 'Road Trip');
    await user.selectOptions(screen.getByLabelText(/category/i), '2');
    await user.type(
      screen.getByLabelText(/description/i),
      'A long enough description for the collage form.'
    );
    await user.type(
      screen.getByLabelText(/tags/i),
      ' jazz,  synth , , ambient '
    );
    await user.click(screen.getByRole('button', { name: /create collage/i }));

    await waitFor(() => {
      expect(mockCreateCollage).toHaveBeenCalledWith({
        name: 'Road Trip',
        description: 'A long enough description for the collage form.',
        categoryId: 2,
        tags: ['jazz', 'synth', 'ambient']
      });
      expect(mockNavigate).toHaveBeenCalledWith('/private/collages/88');
    });
  });

  it('shows "Creating…" button label when isLoading is true', () => {
    mockIsLoading = true;
    renderWithProviders(<CollageCreate />);
    expect(
      screen.getByRole('button', { name: /creating…/i })
    ).toBeInTheDocument();
  });

  it('shows the backend error when creation fails', async () => {
    const user = userEvent.setup();
    mockCreateCollage.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Name already exists' } })
    });

    renderWithProviders(<CollageCreate />);

    await user.type(screen.getByLabelText(/^name$/i), 'Duplicate');
    await user.type(
      screen.getByLabelText(/description/i),
      'A long enough description for the collage form.'
    );
    await user.click(screen.getByRole('button', { name: /create collage/i }));

    await waitFor(() => {
      expect(screen.getByText('Name already exists')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('shows fallback error message when creation fails with no API message', async () => {
    const user = userEvent.setup();
    mockCreateCollage.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    renderWithProviders(<CollageCreate />);
    await user.type(screen.getByLabelText(/^name$/i), 'Test');
    await user.type(
      screen.getByLabelText(/description/i),
      'A long enough description for the collage form.'
    );
    await user.click(screen.getByRole('button', { name: /create collage/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to create collage.')).toBeInTheDocument();
    });
  });

  it('navigates to /private/collages when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CollageCreate />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/private/collages');
  });

  it('disables submit and shows counter when personal collage limit is reached', async () => {
    const user = userEvent.setup();
    mockListCollagesData = { data: [], meta: { total: 1 } };

    renderWithProviders(<CollageCreate />, { store: makeStoreWithUser(1) });

    await user.selectOptions(screen.getByLabelText(/category/i), '0');

    expect(
      screen.getByText('1 / 1 personal collages used')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create collage/i })
    ).toBeDisabled();
  });

  it('shows usage counter but allows submit when under personal collage limit', async () => {
    const user = userEvent.setup();
    mockListCollagesData = { data: [], meta: { total: 1 } };

    renderWithProviders(<CollageCreate />, { store: makeStoreWithUser(2) });

    await user.selectOptions(screen.getByLabelText(/category/i), '0');

    expect(
      screen.getByText('1 / 2 personal collages used')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create collage/i })
    ).not.toBeDisabled();
  });
});
