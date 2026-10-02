import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Settings from '../../components/profile/settings/Settings';

/**
 * The avatar's upload control (#275, #434): an upload fills the avatar field,
 * [Remove] empties it, and the form's own save stores either. Nothing is saved
 * until the member saves.
 */
const URL_ = `/api/asset/${'b'.repeat(64)}`;
const mockUpload = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../../store/services/assetApi', () => ({
  ...jest.requireActual('../../store/services/assetApi'),
  useUploadAssetMutation: () => [mockUpload, { isLoading: false }]
}));

// One object for every render: Settings resets the form when `data` changes,
// so a fresh object per call would re-render forever.
const mockProfile = {
  data: {
    id: 7,
    username: 'testuser',
    avatar: null,
    profile: {
      avatar: 'https://example.com/old.png',
      avatarSrc: `/api/asset/${'c'.repeat(64)}`
    },
    userSettings: {}
  },
  isLoading: false
};

jest.mock('../../store/services/profileApi', () => ({
  useGetMyProfileQuery: () => mockProfile,
  useUpdateMyProfileMutation: () => [mockUpdate, { isLoading: false }]
}));

jest.mock('../../store/services/authApi', () => ({
  useChangePasswordMutation: () => [jest.fn(), { isLoading: false }],
  useChangeEmailMutation: () => [jest.fn(), { isLoading: false }],
  useGetSessionsQuery: () => ({ data: [], isLoading: false }),
  useRevokeSessionMutation: () => [jest.fn(), { isLoading: false }]
}));

jest.mock('../../store/services/siteApi', () => ({
  useGetStylesheetsQuery: () => ({ data: [], isLoading: false })
}));

jest.mock('../../store/slices/authSlice', () => ({
  selectCurrentUser: () => ({
    id: 7,
    username: 'testuser',
    userRank: { assetLimit: 1 }
  })
}));

describe('Settings — avatar upload (#275, #434)', () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockUpdate.mockReset();
    mockUpload.mockReturnValue({
      unwrap: () => Promise.resolve({ url: URL_ })
    });
    mockUpdate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('uploads for the avatar field, previews it, and saves it with the form', async () => {
    renderWithProviders(<Settings />);
    expect(screen.queryByRole('textbox', { name: /^avatar$/i })).toBeNull();
    // The saved remote avatar previews through its resolved src only.
    expect(screen.getByRole('img', { name: 'Current avatar' })).toHaveAttribute(
      'src',
      `/api/asset/${'c'.repeat(64)}`
    );
    const file = new File(['x'], 'me.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Avatar image file'), {
      target: { files: [file] }
    });

    await waitFor(() =>
      expect(
        screen.getByRole('img', { name: 'Current avatar' })
      ).toHaveAttribute('src', URL_)
    );
    expect(screen.getByText('me.png')).toBeInTheDocument();
    expect(mockUpload).toHaveBeenCalledWith({ file, field: 'avatar' });
    expect(mockUpdate).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: /save settings/i })
    );
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ avatar: URL_ })
      )
    );
  });

  it('sends a removed avatar as an empty string on save', async () => {
    renderWithProviders(<Settings />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText('No image.')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /save settings/i })
    );
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ avatar: '' })
      )
    );
  });
});
