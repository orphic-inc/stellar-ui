import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import {
  RandomReleaseLink,
  RandomArtistLink
} from '../../components/search/RandomLinks';

const mockNavigate = jest.fn();
const mockTriggerRelease = jest.fn();
const mockTriggerArtist = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../../store/services/searchApi', () => ({
  useLazyGetRandomReleaseQuery: () => [
    mockTriggerRelease,
    { isFetching: false }
  ],
  useLazyGetRandomArtistQuery: () => [mockTriggerArtist, { isFetching: false }]
}));

describe('RandomReleaseLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerRelease.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ id: 10, communityId: 3, title: 'Kind of Blue' })
    });
  });

  it('renders the button', () => {
    renderWithProviders(<RandomReleaseLink />);
    expect(
      screen.getByRole('button', { name: /random release/i })
    ).toBeInTheDocument();
  });

  it('navigates to release on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomReleaseLink />);
    await user.click(screen.getByRole('button', { name: /random release/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/private/communities/3/releases/10'
      );
    });
  });

  it('does not navigate when release has no communityId', async () => {
    const user = userEvent.setup();
    mockTriggerRelease.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 10, communityId: null })
    });
    renderWithProviders(<RandomReleaseLink />);
    await user.click(screen.getByRole('button', { name: /random release/i }));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('silently catches trigger errors', async () => {
    const user = userEvent.setup();
    mockTriggerRelease.mockReturnValue({
      unwrap: () => Promise.reject(new Error('network'))
    });
    renderWithProviders(<RandomReleaseLink />);
    await user.click(screen.getByRole('button', { name: /random release/i }));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

describe('RandomArtistLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerArtist.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 7, name: 'Miles Davis' })
    });
  });

  it('renders the button', () => {
    renderWithProviders(<RandomArtistLink />);
    expect(
      screen.getByRole('button', { name: /random artist/i })
    ).toBeInTheDocument();
  });

  it('navigates to artist on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomArtistLink />);
    await user.click(screen.getByRole('button', { name: /random artist/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/private/artists/7');
    });
  });

  it('silently catches trigger errors', async () => {
    const user = userEvent.setup();
    mockTriggerArtist.mockReturnValue({
      unwrap: () => Promise.reject(new Error('network'))
    });
    renderWithProviders(<RandomArtistLink />);
    await user.click(screen.getByRole('button', { name: /random artist/i }));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
