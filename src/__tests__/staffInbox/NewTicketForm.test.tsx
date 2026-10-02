import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NewTicketForm from '../../components/staffInbox/NewTicketForm';

const mockCreateTicket = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
let mockTicketMutationIsLoading = false;

jest.mock('../../store/services/staffInboxApi', () => ({
  useCreateTicketMutation: () => [
    mockCreateTicket,
    { isLoading: mockTicketMutationIsLoading }
  ]
}));

/** The rules tree read; only a template asks for it (#100). */
let mockRulesTree: {
  data?: { variables: Record<string, string> };
  isLoading: boolean;
} = { data: { variables: { site_name: 'Orbit' } }, isLoading: false };
const mockRulesTreeArgs = jest.fn();

jest.mock('../../store/services/rulesApi', () => ({
  useGetRulesTreeQuery: (...args: unknown[]) => {
    mockRulesTreeArgs(...args);
    return mockRulesTree;
  }
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (sel: (s: unknown) => unknown) => sel({})
}));

jest.mock('../../store/slices/authSlice', () => ({
  selectCurrentUser: () => ({ id: 7, username: 'kai' })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('NewTicketForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketMutationIsLoading = false;
    mockRulesTree = {
      data: { variables: { site_name: 'Orbit' } },
      isLoading: false
    };
  });

  it('renders subject, message, submit, and cancel buttons', () => {
    renderWithProviders(<NewTicketForm />);
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit ticket/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // Theming contract: field inputs + a primary control.
    expect(
      document.querySelector('input[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
  });

  it('submits ticket and navigates on success', async () => {
    mockCreateTicket.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 42 })
    });
    const user = userEvent.setup();
    renderWithProviders(<NewTicketForm />);
    await user.type(screen.getByLabelText(/subject/i), 'Account problem');
    await user.type(screen.getByLabelText(/message/i), 'I cannot log in.');
    await user.click(screen.getByRole('button', { name: /submit ticket/i }));
    expect(mockCreateTicket).toHaveBeenCalledWith({
      subject: 'Account problem',
      body: 'I cannot log in.'
    });
    expect(mockNavigate).toHaveBeenCalledWith('/inbox/staff/42');
  });

  it('dispatches danger alert on submission failure', async () => {
    mockCreateTicket.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Server unavailable.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<NewTicketForm />);
    await user.type(screen.getByLabelText(/subject/i), 'Broken');
    await user.type(screen.getByLabelText(/message/i), 'Help me.');
    await user.click(screen.getByRole('button', { name: /submit ticket/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('dispatches fallback danger alert when rejection has no API message', async () => {
    mockCreateTicket.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<NewTicketForm />);
    await user.type(screen.getByLabelText(/subject/i), 'Problem');
    await user.type(screen.getByLabelText(/message/i), 'Details here.');
    await user.click(screen.getByRole('button', { name: /submit ticket/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Failed to create ticket.',
          alertType: 'danger'
        })
      })
    );
  });

  it('shows "Submitting…" label when mutation is loading', () => {
    mockTicketMutationIsLoading = true;
    renderWithProviders(<NewTicketForm />);
    expect(
      screen.getByRole('button', { name: /submitting…/i })
    ).toBeInTheDocument();
  });

  it('navigates back on cancel click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewTicketForm />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/inbox/staff');
  });

  describe('the community-request template (#100)', () => {
    const TEMPLATE = ['/inbox/staff/new?template=community-request'];
    const BODY = [
      'Hey there Orbit staff,',
      '',
      'Community name: ',
      'What it would hold: ',
      "Why I'd lead it: ",
      '',
      'Best, kai'
    ].join('\n');

    it('fills the body with the site name and the member, cursor after the name label', () => {
      renderWithProviders(<NewTicketForm />, { initialEntries: TEMPLATE });
      const body = screen.getByLabelText(/message/i) as HTMLTextAreaElement;
      expect(body.value).toBe(BODY);
      expect(body).toHaveFocus();
      const cursor =
        BODY.indexOf('Community name: ') + 'Community name: '.length;
      expect(body.selectionStart).toBe(cursor);
      expect(body.selectionEnd).toBe(cursor);
    });

    it('waits for the site name before filling the body', () => {
      mockRulesTree = { data: undefined, isLoading: true };
      renderWithProviders(<NewTicketForm />, { initialEntries: TEMPLATE });
      expect(screen.queryByLabelText(/message/i)).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('greets staff without a name when the rules tree cannot be read', () => {
      mockRulesTree = { data: undefined, isLoading: false };
      renderWithProviders(<NewTicketForm />, { initialEntries: TEMPLATE });
      const body = screen.getByLabelText(/message/i) as HTMLTextAreaElement;
      expect(body.value.split('\n')[0]).toBe('Hey there staff,');
    });

    it("sends the fixed tag before the member's subject line", async () => {
      mockCreateTicket.mockReturnValue({
        unwrap: () => Promise.resolve({ id: 9 })
      });
      const user = userEvent.setup();
      renderWithProviders(<NewTicketForm />, { initialEntries: TEMPLATE });
      expect(
        screen.getByText('[Create a Community Request]')
      ).toBeInTheDocument();
      const subject = screen.getByLabelText(/subject/i);
      expect(subject).toHaveValue('');
      expect(subject).toHaveAttribute(
        'maxLength',
        String(255 - '[Create a Community Request] '.length)
      );
      await user.type(subject, 'A home for field recordings');
      await user.click(screen.getByRole('button', { name: /submit ticket/i }));
      expect(mockCreateTicket).toHaveBeenCalledWith({
        subject: '[Create a Community Request] A home for field recordings',
        body: BODY
      });
    });

    it('opens the blank form for an unknown template, without reading the rules', () => {
      renderWithProviders(<NewTicketForm />, {
        initialEntries: ['/inbox/staff/new?template=nope']
      });
      expect(screen.getByLabelText(/message/i)).toHaveValue('');
      expect(screen.queryByText(/create a community request/i)).toBeNull();
      expect(mockRulesTreeArgs).toHaveBeenCalledWith(undefined, { skip: true });
    });
  });
});
