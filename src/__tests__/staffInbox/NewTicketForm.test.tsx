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

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('NewTicketForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketMutationIsLoading = false;
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
    expect(mockNavigate).toHaveBeenCalledWith('/private/messages/tickets/42');
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
    expect(mockNavigate).toHaveBeenCalledWith('/private/messages/tickets');
  });
});
