import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import InviteForm from '../../components/profile/invite/InviteForm';

const mockCreateInvite = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/profileApi', () => ({
  useCreateInviteMutation: () => [mockCreateInvite, { isLoading: false }]
}));

jest.mock('../../store/slices/authSlice', () => ({
  selectCurrentUser: () => ({ id: 7, username: 'testuser' })
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (sel: (s: unknown) => unknown) => sel({}),
  useDispatch: () => mockDispatch
}));

describe('InviteForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders invite form with email and reason fields', () => {
    renderWithProviders(<InviteForm />);
    expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /invite tree/i })
    ).toBeInTheDocument();
  });

  it('shows warning text about invite responsibility', () => {
    renderWithProviders(<InviteForm />);
    expect(
      screen.getByText(/you are responsible for all invitees/i)
    ).toBeInTheDocument();
  });

  it('submits invite with email and optional reason', async () => {
    mockCreateInvite.mockReturnValue({
      unwrap: () => Promise.resolve({ emailSent: true })
    });
    const user = userEvent.setup();
    renderWithProviders(<InviteForm />);
    const emailInput = document.querySelector(
      'input[type="email"]'
    ) as HTMLInputElement;
    const textInputs = document.querySelectorAll('input[type="text"]');
    const reasonInput = textInputs[0] as HTMLInputElement;
    await user.type(emailInput, 'friend@example.com');
    await user.type(reasonInput, 'Friend from IRC');
    await user.click(screen.getByRole('button', { name: /invite/i }));
    expect(mockCreateInvite).toHaveBeenCalledWith({
      email: 'friend@example.com',
      reason: 'Friend from IRC'
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('dispatches success alert when email is sent', async () => {
    mockCreateInvite.mockReturnValue({
      unwrap: () => Promise.resolve({ emailSent: true })
    });
    const user = userEvent.setup();
    renderWithProviders(<InviteForm />);
    await user.type(
      document.querySelector('input[type="email"]') as HTMLElement,
      'a@b.com'
    );
    await user.click(screen.getByRole('button', { name: /invite/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Invitation sent successfully.'
        })
      })
    );
  });

  it('dispatches warning alert when email is not sent (email not configured)', async () => {
    mockCreateInvite.mockReturnValue({
      unwrap: () => Promise.resolve({ emailSent: false })
    });
    const user = userEvent.setup();
    renderWithProviders(<InviteForm />);
    await user.type(
      document.querySelector('input[type="email"]') as HTMLElement,
      'a@b.com'
    );
    await user.click(screen.getByRole('button', { name: /invite/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: expect.stringMatching(/email delivery is not configured/i)
        })
      })
    );
  });

  it('dispatches danger alert on API failure', async () => {
    mockCreateInvite.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'No invites available.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<InviteForm />);
    await user.type(
      document.querySelector('input[type="email"]') as HTMLElement,
      'a@b.com'
    );
    await user.click(screen.getByRole('button', { name: /invite/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('clears form fields after successful invite', async () => {
    mockCreateInvite.mockReturnValue({
      unwrap: () => Promise.resolve({ emailSent: true })
    });
    const user = userEvent.setup();
    renderWithProviders(<InviteForm />);
    const emailInput = document.querySelector(
      'input[type="email"]'
    ) as HTMLInputElement;
    await user.type(emailInput, 'friend@example.com');
    await user.click(screen.getByRole('button', { name: /invite/i }));
    expect(emailInput.value).toBe('');
  });
});
