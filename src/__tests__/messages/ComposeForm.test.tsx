import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComposeForm from '../../components/messages/ComposeForm';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockCompose = jest.fn();
const mockCreateDraft = jest.fn();
const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/messagesApi', () => ({
  useComposeMessageMutation: () => [mockCompose, { isLoading: false }],
  useCreateDraftMutation: () => [mockCreateDraft, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams()
}));

describe('ComposeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([new URLSearchParams('to=alice')]);
    mockCompose.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 12 })
    });
    mockCreateDraft.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 5 })
    });
  });

  it('prefills the username, sends a message, and saves drafts', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<ComposeForm />, { store });

    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^subject$/i), 'Hello');
    await user.type(screen.getByLabelText(/^message$/i), 'How are you?');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      expect(mockCompose).toHaveBeenCalledWith({
        toUsername: 'alice',
        subject: 'Hello',
        body: 'How are you?'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/private/messages/12');
    });

    await user.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => {
      expect(mockCreateDraft).toHaveBeenCalledWith({
        subject: 'Hello',
        body: 'How are you?'
      });
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Draft saved.')).toBe(true);
    });
  });

  it('shows alerts for missing recipient, empty draft, and compose failure', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
    mockCompose.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Recipient not found' } })
    });

    renderWithProviders(<ComposeForm />, { store });

    await user.type(screen.getByLabelText(/^subject$/i), 'Draftable');
    await user.type(screen.getByLabelText(/^message$/i), 'Body text');
    fireEvent.submit(
      screen.getByRole('button', { name: /^send$/i }).closest('form')!
    );

    let alerts = selectAlerts(store.getState());
    expect(
      alerts.some((a) => a.msg === 'Recipient username is required.')
    ).toBe(true);

    await user.clear(screen.getByLabelText(/^subject$/i));
    await user.clear(screen.getByLabelText(/^message$/i));
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    alerts = selectAlerts(store.getState());
    expect(alerts.some((a) => a.msg === 'Nothing to save.')).toBe(true);

    await user.type(screen.getByLabelText(/to \(username\)/i), 'nobody');
    await user.type(screen.getByLabelText(/^subject$/i), 'Test');
    await user.type(screen.getByLabelText(/^message$/i), 'Failure');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Recipient not found')).toBe(true);
    });
  });
});
