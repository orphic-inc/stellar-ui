import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComposeForm from '../../components/messages/ComposeForm';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import { createTestStore, renderWithProviders } from '../testUtils';

const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams()
}));

describe('ComposeForm RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('to=%20alice%20')
    ]);
  });

  it('sends a real compose mutation and saves a draft through RTK Query', async () => {
    const user = userEvent.setup();
    const store = createTestStore();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeResponse({ body: { id: 12 } }))
      .mockResolvedValueOnce(makeResponse({ body: { id: 5 } }));

    renderWithProviders(<ComposeForm />, { store });

    expect(screen.getByLabelText(/to \(username\)/i)).toHaveValue(' alice ');

    await user.type(screen.getByLabelText(/^subject$/i), 'Hello');
    await user.type(screen.getByLabelText(/^message$/i), 'How are you?');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(async () => {
      const composeRequest = (global.fetch as jest.Mock).mock
        .calls[0][0] as Request;
      expect(composeRequest.url).toContain('/api/messages');
      expect(composeRequest.method).toBe('POST');
      expect(await composeRequest.text()).toBe(
        JSON.stringify({
          toUsername: 'alice',
          subject: 'Hello',
          body: 'How are you?'
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/private/messages/12');
    });

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(async () => {
      const draftRequest = (global.fetch as jest.Mock).mock
        .calls[1][0] as Request;
      expect(draftRequest.url).toContain('/api/messages/drafts');
      expect(draftRequest.method).toBe('POST');
      expect(await draftRequest.text()).toBe(
        JSON.stringify({
          toUsername: 'alice',
          subject: 'Hello',
          body: 'How are you?'
        })
      );
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Draft saved.')).toBe(true);
    });
  });

  it('surfaces server error messages for failed compose requests', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({
        status: 404,
        body: { msg: 'recipient_not_found' }
      })
    );

    renderWithProviders(<ComposeForm />, { store });

    await user.type(screen.getByLabelText(/to \(username\)/i), 'ghost');
    await user.type(screen.getByLabelText(/^subject$/i), 'Hello');
    await user.type(screen.getByLabelText(/^message$/i), 'Anybody there?');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'recipient_not_found')).toBe(true);
    });
  });
});
