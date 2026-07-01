import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CannedResponsesPage from '../../components/staffInbox/CannedResponsesPage';

const mockUseGetCannedResponsesQuery = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/staffInboxApi', () => ({
  useGetCannedResponsesQuery: () => mockUseGetCannedResponsesQuery(),
  useCreateCannedResponseMutation: () => [mockCreate, { isLoading: false }],
  useUpdateCannedResponseMutation: () => [mockUpdate, { isLoading: false }],
  useDeleteCannedResponseMutation: () => [mockDelete, { isLoading: false }]
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch
}));

const makeResponse = (id: number) => ({
  id,
  name: `Response ${id}`,
  body: `Body of response ${id}`,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
});

describe('CannedResponsesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUpdate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows spinner while loading', () => {
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<CannedResponsesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no responses', () => {
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    expect(screen.getByText(/no canned responses/i)).toBeInTheDocument();
  });

  it('renders list of canned responses with edit and delete buttons', () => {
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [makeResponse(1), makeResponse(2)],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    expect(screen.getByText('Response 1')).toBeInTheDocument();
    expect(screen.getByText('Body of response 1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /edit/i }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBe(2);

    // Theming contract: cards are panels, actions are controls.
    expect(document.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(
      document.querySelector('[data-st="control"][data-st-danger]')
    ).toBeInTheDocument();
  });

  it('opens new response form on New Response button click', async () => {
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /new response/i }));
    expect(
      screen.getByRole('button', { name: /^create$/i })
    ).toBeInTheDocument();
  });

  it('creates a new canned response on submit', async () => {
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /new response/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'Greeting');
    await user.type(
      screen.getByLabelText(/^body$/i),
      'Hello, how can we help you?'
    );
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Greeting',
      body: 'Hello, how can we help you?'
    });
  });

  it('opens edit form prefilled with response data on Edit click', async () => {
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [makeResponse(5)],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe(
      'Response 5'
    );
  });

  it('dispatches danger alert when create fails', async () => {
    mockCreate.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Server error.' } })
    });
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /new response/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'Fail');
    await user.type(screen.getByLabelText(/^body$/i), 'Fail body');
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('dispatches danger alert when update fails', async () => {
    mockUpdate.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Update failed.' } })
    });
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [makeResponse(5)],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('dispatches danger alert when delete fails', async () => {
    mockDelete.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Delete failed.' } })
    });
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [makeResponse(8)],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('edits the body in the edit form and updates editing state', async () => {
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [makeResponse(5)],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /edit/i }));

    const bodyTextarea = screen.getByDisplayValue(
      'Body of response 5'
    ) as HTMLTextAreaElement;
    await user.clear(bodyTextarea);
    await user.type(bodyTextarea, 'Updated body text');
    expect(bodyTextarea.value).toBe('Updated body text');
  });

  it('shows empty state when data is undefined (not loading)', () => {
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: undefined,
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    expect(screen.getByText(/no canned responses/i)).toBeInTheDocument();
  });

  it('calls deleteResponse after confirm', async () => {
    const user = userEvent.setup();
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [makeResponse(7)],
      isLoading: false
    });
    renderWithProviders(<CannedResponsesPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith(7);
  });
});
