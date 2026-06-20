import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import IrcNickSettings from '../../components/profile/settings/IrcNickSettings';

const mockLink = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useLinkIrcNickMutation: () => [mockLink, { isLoading: false }]
}));

describe('IrcNickSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLink.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          msg: 'Verification required',
          ircNick: 'spider',
          code: 'abc123',
          instructions: 'Send "!verify abc123" to the stellar-bridge bot.'
        })
    });
  });

  it('submits a nick claim and shows the verification instructions', async () => {
    renderWithProviders(<IrcNickSettings userId={42} />);

    await userEvent.type(screen.getByLabelText('IRC nick'), 'spider');
    await userEvent.click(screen.getByRole('button', { name: 'Link nick' }));

    expect(mockLink).toHaveBeenCalledWith({ id: 42, ircNick: 'spider' });
    expect(
      await screen.findByText(/Send "!verify abc123" to the stellar-bridge bot/)
    ).toBeInTheDocument();
  });

  it('clears the IRC nick', async () => {
    mockLink.mockReturnValue({
      unwrap: () => Promise.resolve({ msg: 'IRC nick cleared' })
    });
    renderWithProviders(<IrcNickSettings userId={42} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Clear IRC nick' })
    );

    expect(mockLink).toHaveBeenCalledWith({ id: 42, ircNick: null });
  });

  it('disables the link button when the nick is empty', () => {
    renderWithProviders(<IrcNickSettings userId={42} />);
    expect(screen.getByRole('button', { name: 'Link nick' })).toBeDisabled();
  });
});
