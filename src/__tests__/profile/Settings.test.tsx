import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Settings from '../../components/profile/settings/Settings';

const mockUseGetMyProfileQuery = jest.fn();
const mockUseUpdateMyProfileMutation = jest.fn();
const mockUseChangePasswordMutation = jest.fn();
const mockUseChangeEmailMutation = jest.fn();
const mockUseGetSessionsQuery = jest.fn();
const mockUseRevokeSessionMutation = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/profileApi', () => ({
  useGetMyProfileQuery: () => mockUseGetMyProfileQuery(),
  useUpdateMyProfileMutation: () => mockUseUpdateMyProfileMutation()
}));

jest.mock('../../store/services/authApi', () => ({
  useChangePasswordMutation: () => mockUseChangePasswordMutation(),
  useChangeEmailMutation: () => mockUseChangeEmailMutation(),
  useGetSessionsQuery: (...args: unknown[]) =>
    mockUseGetSessionsQuery(...args),
  useRevokeSessionMutation: () => mockUseRevokeSessionMutation()
}));

jest.mock('../../store/slices/authSlice', () => ({
  selectCurrentUser: () => ({ id: 7, username: 'testuser' })
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (sel: (s: unknown) => unknown) => sel({}),
  useDispatch: () => mockDispatch
}));

const makeProfile = () => ({
  id: 7,
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  profile: {
    avatar: null,
    avatarMouseoverText: '',
    profileTitle: '',
    profileInfo: ''
  },
  userSettings: {
    siteAppearance: '',
    externalStylesheet: '',
    styledTooltips: false,
    paranoia: 0,
    notificationMethod: 'popup',
    showEmail: false,
    showLastSeen: true,
    showContributedStats: true,
    showConsumedStats: true,
    showRatioStats: true
  }
});

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetMyProfileQuery.mockReturnValue({
      data: makeProfile(),
      isLoading: false
    });
    mockUseUpdateMyProfileMutation.mockReturnValue([
      jest.fn().mockResolvedValue({}),
      { isLoading: false }
    ]);
    mockUseChangePasswordMutation.mockReturnValue([
      jest.fn().mockResolvedValue({}),
      { isLoading: false }
    ]);
    mockUseChangeEmailMutation.mockReturnValue([
      jest.fn().mockResolvedValue({}),
      { isLoading: false }
    ]);
    mockUseGetSessionsQuery.mockReturnValue({
      data: [],
      isLoading: false
    });
    mockUseRevokeSessionMutation.mockReturnValue([
      jest.fn().mockResolvedValue({}),
      { isLoading: false }
    ]);
  });

  it('shows spinner while loading', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<Settings />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders appearance tab by default', () => {
    renderWithProviders(<Settings />);
    expect(screen.getByLabelText(/avatar url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/profile bio/i)).toBeInTheDocument();
  });

  it('switches to privacy tab and shows paranoia options', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Settings />);
    await user.click(screen.getByRole('button', { name: /privacy/i }));
    expect(screen.getByText(/paranoia level/i)).toBeInTheDocument();
    expect(screen.getByText(/level 0:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notification method/i)).toBeInTheDocument();
  });

  it('switches to security tab and shows password/email/sessions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Settings />);
    await user.click(screen.getByRole('button', { name: /security/i }));
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByLabelText(/new email address/i)).toBeInTheDocument();
    expect(screen.getAllByText(/active sessions/i).length).toBeGreaterThan(0);
  });

  it('dispatches success on profile save', async () => {
    const updateFn = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUseUpdateMyProfileMutation.mockReturnValue([
      updateFn,
      { isLoading: false }
    ]);
    const user = userEvent.setup();
    renderWithProviders(<Settings />);
    await user.click(screen.getByRole('button', { name: /save settings/i }));
    // dispatch is called asynchronously after save
    await new Promise((r) => setTimeout(r, 0));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('dispatches danger alert when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Settings />);
    await user.click(screen.getByRole('button', { name: /security/i }));
    await user.type(screen.getByLabelText('Current password'), 'oldpass');
    await user.type(screen.getByLabelText('New password'), 'newpass1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass2');
    await user.click(screen.getByRole('button', { name: /change password/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'New passwords do not match.',
          alertType: 'danger'
        })
      })
    );
  });

  it('calls changePassword when passwords match', async () => {
    const changePwFn = jest
      .fn()
      .mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUseChangePasswordMutation.mockReturnValue([
      changePwFn,
      { isLoading: false }
    ]);
    const user = userEvent.setup();
    renderWithProviders(<Settings />);
    await user.click(screen.getByRole('button', { name: /security/i }));
    await user.type(screen.getByLabelText('Current password'), 'oldpass');
    await user.type(screen.getByLabelText('New password'), 'samepass1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'samepass1');
    await user.click(screen.getByRole('button', { name: /change password/i }));
    expect(changePwFn).toHaveBeenCalledWith({
      currentPassword: 'oldpass',
      newPassword: 'samepass1'
    });
  });

  it('shows active sessions and revoke button for non-current sessions', async () => {
    mockUseGetSessionsQuery.mockReturnValue({
      data: [
        {
          id: 'abc',
          userAgent: 'Firefox/120',
          ipAddress: '1.2.3.4',
          lastActiveAt: '2026-05-17T12:00:00Z',
          isCurrent: false
        },
        {
          id: 'xyz',
          userAgent: 'Chrome/124',
          ipAddress: '5.6.7.8',
          lastActiveAt: '2026-05-17T13:00:00Z',
          isCurrent: true
        }
      ],
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<Settings />);
    await user.click(screen.getByRole('button', { name: /security/i }));
    expect(screen.getByText('Firefox/120')).toBeInTheDocument();
    expect(screen.getByText(/this session/i)).toBeInTheDocument();
    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
    expect(revokeButtons).toHaveLength(1);
  });

  it('shows no sessions message when list is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Settings />);
    await user.click(screen.getByRole('button', { name: /security/i }));
    expect(
      screen.getByText(/no active sessions found/i)
    ).toBeInTheDocument();
  });
});
