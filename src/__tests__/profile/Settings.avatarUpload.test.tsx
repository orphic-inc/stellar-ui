import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Settings from '../../components/profile/settings/Settings';

/**
 * The avatar's upload control (#275): an upload fills the avatar field, and the
 * form's own save stores it. Nothing is saved until the member saves.
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
    profile: { avatar: 'https://example.com/old.png' },
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

describe('Settings — avatar upload (#275)', () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockUpdate.mockReset();
    mockUpload.mockReturnValue({
      unwrap: () => Promise.resolve({ url: URL_ })
    });
    mockUpdate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('uploads for the avatar field, fills it, and saves it with the form', async () => {
    renderWithProviders(<Settings />);
    const file = new File(['x'], 'me.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText(/upload an image/i), {
      target: { files: [file] }
    });

    await waitFor(() =>
      expect(screen.getByLabelText(/^avatar$/i)).toHaveValue(URL_)
    );
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
});
