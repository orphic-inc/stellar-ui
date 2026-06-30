import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import MassPmPage from '../../components/staff/MassPmPage';

const mockSendMassPm = jest.fn();
const mockUseGetUserRanksQuery = jest.fn();
const mockDispatch = jest.fn();
let mockIsSending = false;

jest.mock('../../store/services/messagesApi', () => ({
  useSendMassPmMutation: () => [mockSendMassPm, { isLoading: mockIsSending }]
}));

jest.mock('../../store/services/userApi', () => ({
  useGetUserRanksQuery: () => mockUseGetUserRanksQuery()
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

describe('MassPmPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSending = false;
    window.confirm = jest.fn().mockReturnValue(true);
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [
        { id: 1, name: 'Member', level: 100 },
        { id: 2, name: 'Staff', level: 500 }
      ],
      isLoading: false
    });
    mockSendMassPm.mockReturnValue({
      unwrap: () => Promise.resolve({ sentCount: 42 })
    });
  });

  it('renders subject, message, and target rank fields', () => {
    renderWithProviders(<MassPmPage />);
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'All users' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Member' })).toBeInTheDocument();
  });

  it('paints the form controls with the field Role (kit hooks present)', () => {
    renderWithProviders(<MassPmPage />);
    expect(
      document.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('textarea[data-st="field"]')
    ).toBeInTheDocument();
  });

  it('shows warning about mass send', () => {
    renderWithProviders(<MassPmPage />);
    expect(screen.getByText(/warning:/i)).toBeInTheDocument();
  });

  it('send button is disabled when fields are empty', () => {
    renderWithProviders(<MassPmPage />);
    expect(
      screen.getByRole('button', { name: /send mass pm/i })
    ).toBeDisabled();
  });

  it('calls sendMassPm with subject, body, and no rank when submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MassPmPage />);
    await user.type(screen.getByLabelText(/subject/i), 'Important notice');
    await user.type(
      screen.getByLabelText(/message/i),
      'Please read the announcement.'
    );
    await user.click(screen.getByRole('button', { name: /send mass pm/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockSendMassPm).toHaveBeenCalledWith({
      subject: 'Important notice',
      body: 'Please read the announcement.',
      targetRankId: undefined
    });
  });

  it('passes selected rank id to sendMassPm', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MassPmPage />);
    await user.type(screen.getByLabelText(/subject/i), 'Staff meeting');
    await user.type(screen.getByLabelText(/message/i), 'Join us tonight.');
    await user.selectOptions(screen.getByRole('combobox'), '2');
    await user.click(screen.getByRole('button', { name: /send mass pm/i }));
    expect(mockSendMassPm).toHaveBeenCalledWith(
      expect.objectContaining({ targetRankId: 2 })
    );
  });

  it('resets targetRankId to empty string when selecting "All users"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MassPmPage />);
    await user.type(screen.getByLabelText(/subject/i), 'Broadcast');
    await user.type(screen.getByLabelText(/message/i), 'Hello all.');
    await user.selectOptions(screen.getByRole('combobox'), '2');
    await user.selectOptions(screen.getByRole('combobox'), '');
    await user.click(screen.getByRole('button', { name: /send mass pm/i }));
    expect(mockSendMassPm).toHaveBeenCalledWith(
      expect.objectContaining({ targetRankId: undefined })
    );
  });

  it('shows success result count after send', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MassPmPage />);
    await user.type(screen.getByLabelText(/subject/i), 'Hi');
    await user.type(screen.getByLabelText(/message/i), 'Hello everyone');
    await user.click(screen.getByRole('button', { name: /send mass pm/i }));
    await screen.findByText(/42 messages delivered/i);
  });

  it('does not send when user cancels confirm', async () => {
    window.confirm = jest.fn().mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<MassPmPage />);
    await user.type(screen.getByLabelText(/subject/i), 'Hi');
    await user.type(screen.getByLabelText(/message/i), 'Hello everyone');
    await user.click(screen.getByRole('button', { name: /send mass pm/i }));
    expect(mockSendMassPm).not.toHaveBeenCalled();
  });

  it('dispatches danger alert on API failure', async () => {
    mockSendMassPm.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Permission denied.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<MassPmPage />);
    await user.type(screen.getByLabelText(/subject/i), 'Hi');
    await user.type(screen.getByLabelText(/message/i), 'Hello everyone');
    await user.click(screen.getByRole('button', { name: /send mass pm/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('dispatches fallback danger alert when rejection has no API message', async () => {
    mockSendMassPm.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<MassPmPage />);
    await user.type(screen.getByLabelText(/subject/i), 'Hi');
    await user.type(screen.getByLabelText(/message/i), 'Hello everyone');
    await user.click(screen.getByRole('button', { name: /send mass pm/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Failed to send mass PM.',
          alertType: 'danger'
        })
      })
    );
  });

  it('shows spinner while ranks are loading', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<MassPmPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows "Sending…" button label when isSending is true', () => {
    mockIsSending = true;
    renderWithProviders(<MassPmPage />);
    expect(
      screen.getByRole('button', { name: /sending…/i })
    ).toBeInTheDocument();
  });
});
