import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComposeForm from '../../components/messages/ComposeForm';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockCompose = jest.fn();
const mockCreateDraft = jest.fn();
const mockUpdateDraft = jest.fn();
const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();

let mockIsComposing = false;
let mockIsSavingDraft = false;

jest.mock('../../store/services/messagesApi', () => ({
  useComposeMessageMutation: () => [
    mockCompose,
    { isLoading: mockIsComposing }
  ],
  useCreateDraftMutation: () => [
    mockCreateDraft,
    { isLoading: mockIsSavingDraft }
  ],
  useUpdateDraftMutation: () => [mockUpdateDraft, {}],
  useGetDraftsQuery: () => ({ data: undefined })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams()
}));

describe('ComposeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsComposing = false;
    mockIsSavingDraft = false;
    mockUseSearchParams.mockReturnValue([new URLSearchParams('to=alice')]);
    mockCompose.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 12 })
    });
    mockCreateDraft.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 5 })
    });
  });

  it('carries the data-st contract hooks (field/control)', () => {
    renderWithProviders(<ComposeForm />);
    expect(
      document.querySelectorAll('input[data-st="field"]').length
    ).toBeGreaterThanOrEqual(2);
    expect(
      document.querySelector('textarea[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
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
      expect(mockNavigate).toHaveBeenCalledWith('/messages/12');
    });

    await user.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => {
      expect(mockCreateDraft).toHaveBeenCalledWith({
        toUsername: 'alice',
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

  it('dispatches fallback danger alert when compose fails with no API message', async () => {
    mockCompose.mockReturnValue({ unwrap: () => Promise.reject({}) });
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<ComposeForm />, { store });
    await user.type(screen.getByLabelText(/^subject$/i), 'Test');
    await user.type(screen.getByLabelText(/^message$/i), 'Body');
    await user.click(screen.getByRole('button', { name: /^send$/i }));
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to send message.')).toBe(
        true
      );
    });
  });

  it('dispatches danger alert when createDraft fails', async () => {
    mockCreateDraft.mockReturnValue({ unwrap: () => Promise.reject({}) });
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<ComposeForm />, { store });
    await user.type(screen.getByLabelText(/^message$/i), 'Body only');
    await user.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to save draft.')).toBe(true);
    });
  });

  it('saves draft with "(no subject)" when subject is empty but body has content', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<ComposeForm />, { store });

    await user.type(screen.getByLabelText(/^message$/i), 'Just a body');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreateDraft).toHaveBeenCalledWith({
        toUsername: 'alice',
        subject: '(no subject)',
        body: 'Just a body'
      });
    });
  });

  it('navigates to /messages when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComposeForm />);
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/messages');
  });

  it('shows "Sending…" when isLoading is true', () => {
    mockIsComposing = true;
    renderWithProviders(<ComposeForm />);
    expect(
      screen.getByRole('button', { name: /sending…/i })
    ).toBeInTheDocument();
  });

  it('shows "Saving…" when isSavingDraft is true', () => {
    mockIsSavingDraft = true;
    renderWithProviders(<ComposeForm />);
    expect(
      screen.getByRole('button', { name: /saving…/i })
    ).toBeInTheDocument();
  });
});
