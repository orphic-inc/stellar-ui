import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import InviteForm from '../../components/profile/invite/InviteForm';

const mockCreateInvite = jest.fn();
const mockDispatch = jest.fn();
/** The eligibility read; undefined data is the fail-open case (#331). */
let mockEligibility: {
  data?: {
    canSend: boolean;
    reason: string | null;
    msg: string | null;
    unlimited: boolean;
  };
  isLoading: boolean;
} = {
  data: { canSend: true, reason: null, msg: null, unlimited: false },
  isLoading: false
};

jest.mock('../../store/services/profileApi', () => ({
  useCreateInviteMutation: () => [mockCreateInvite, { isLoading: false }],
  useGetInviteEligibilityQuery: () => mockEligibility
}));

// The sections either side of the form have their own suites.
jest.mock('../../components/profile/invite/InviteTree', () => ({
  __esModule: true,
  default: () => <div data-testid="invite-tree" />
}));

jest.mock('../../components/profile/invite/InviteRules', () => ({
  __esModule: true,
  default: () => <div data-testid="invite-rules" />
}));

jest.mock('../../components/profile/invite/PendingInvites', () => ({
  __esModule: true,
  default: () => <div data-testid="pending-invites" />
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
    mockEligibility = {
      data: { canSend: true, reason: null, msg: null, unlimited: false },
      isLoading: false
    };
  });

  it('renders invite form with email and reason fields', () => {
    renderWithProviders(<InviteForm />);
    expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
    expect(screen.getByTestId('invite-tree')).toBeInTheDocument();
  });

  // The hard-coded paraphrase of the rules is gone: they are quoted from
  // GET /rules/tree now (#331), above the form and above the tree.
  it('reads rules, then send, then pending invites, then the tree', () => {
    const { container } = renderWithProviders(<InviteForm />);
    const order = ['invite-rules', 'pending-invites', 'invite-tree'].map((id) =>
      Array.prototype.indexOf.call(
        container.querySelectorAll('*'),
        screen.getByTestId(id)
      )
    );
    const form = Array.prototype.indexOf.call(
      container.querySelectorAll('*'),
      container.querySelector('form')
    );
    expect(order[0]).toBeLessThan(form);
    expect(form).toBeLessThan(order[1]);
    expect(order[1]).toBeLessThan(order[2]);
    expect(
      screen.queryByText(/you are responsible for all invitees/i)
    ).not.toBeInTheDocument();
  });

  it('paints from the data-st panel/field/control contract', () => {
    const { container } = renderWithProviders(<InviteForm />);
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(
      container.querySelector('input[type="email"][data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('input[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
    expect(container.querySelector('[data-st="meta"]')).toBeInTheDocument();
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

  it('dispatches fallback danger alert when API error has no message', async () => {
    mockCreateInvite.mockReturnValue({
      unwrap: () => Promise.reject({})
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
          msg: 'Failed to send invite. Please try again.'
        })
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

describe('InviteForm send gate (#331)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const eligibility = (
    data: Partial<{
      canSend: boolean;
      reason: string | null;
      msg: string | null;
      unlimited: boolean;
    }>,
    isLoading = false
  ) => {
    mockEligibility = {
      data:
        data.canSend === undefined && !Object.keys(data).length
          ? undefined
          : ({
              canSend: true,
              reason: null,
              msg: null,
              unlimited: false,
              ...data
            } as never),
      isLoading
    };
  };

  it('replaces the form with the api msg when a gate refuses', () => {
    eligibility({
      canSend: false,
      reason: 'ratio_watch',
      msg: 'You are on ratio watch, so invites cannot be sent until your ratio meets its requirement. Your invite was not used.'
    });
    const { container } = renderWithProviders(<InviteForm />);
    expect(container.querySelector('form')).not.toBeInTheDocument();
    expect(screen.getByText(/on ratio watch/i)).toBeInTheDocument();
  });

  it('links a trailing site path in the refusal', () => {
    eligibility({
      canSend: false,
      reason: 'invites_revoked',
      msg: 'Your invite privileges have been revoked, so this invite was not sent. Contact staff through Staff PM: /inbox/staff'
    });
    renderWithProviders(<InviteForm />);
    expect(screen.getByRole('link', { name: '/inbox/staff' })).toHaveAttribute(
      'href',
      '/inbox/staff'
    );
    expect(screen.getByText(/revoked/i)).toBeInTheDocument();
  });

  it('shows a spinner rather than the form while the gate loads', () => {
    eligibility({}, true);
    const { container } = renderWithProviders(<InviteForm />);
    expect(container.querySelector('form')).not.toBeInTheDocument();
  });

  it('fails open: the form renders when the gate could not be read', () => {
    eligibility({});
    const { container } = renderWithProviders(<InviteForm />);
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('says unlimited instead of a balance for an unlimited sender', () => {
    eligibility({ unlimited: true });
    const { container } = renderWithProviders(<InviteForm />);
    expect(screen.getByText(/invites: unlimited/i)).toBeInTheDocument();
    expect(container.querySelector('form')).toBeInTheDocument();
  });
});
