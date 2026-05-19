import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CannedResponsesPage from '../../components/staffInbox/CannedResponsesPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

// ── factories ─────────────────────────────────────────────────────────────────

const makeResponse_ = (
  id: number,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  name: `Response ${id}`,
  body: `Body text for response ${id}`,
  createdAt: '2025-06-15T12:00:00Z',
  updatedAt: '2025-06-15T12:00:00Z',
  ...overrides
});

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  responses?: ReturnType<typeof makeResponse_>[];
  listStatus?: number;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const { responses = [makeResponse_(1), makeResponse_(2)], listStatus = 200 } =
    opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');
    const { pathname, method } = {
      pathname: url.pathname,
      method: request.method
    };

    if (pathname === '/api/staff-inbox/responses' && method === 'GET') {
      return Promise.resolve(
        makeResponse({
          status: listStatus,
          body: listStatus === 200 ? responses : { msg: 'Server error' }
        })
      );
    }
    if (pathname === '/api/staff-inbox/responses' && method === 'POST') {
      return Promise.resolve(
        makeResponse({
          status: 201,
          body: makeResponse_(99, { name: 'New One', body: 'New body' })
        })
      );
    }
    if (
      pathname.match(/^\/api\/staff-inbox\/responses\/\d+$/) &&
      method === 'PUT'
    ) {
      const id = Number(pathname.split('/').pop());
      return Promise.resolve(
        makeResponse({
          status: 200,
          body: makeResponse_(id, { name: 'Updated', body: 'Updated body' })
        })
      );
    }
    if (
      pathname.match(/^\/api\/staff-inbox\/responses\/\d+$/) &&
      method === 'DELETE'
    ) {
      return Promise.resolve(makeResponse({ status: 204, body: undefined }));
    }

    return Promise.resolve(
      makeResponse({
        status: 404,
        body: { msg: `Unhandled: ${method} ${pathname}` }
      })
    );
  });
};

// ── helpers ───────────────────────────────────────────────────────────────────

const getRequestsTo = (method: string, path: RegExp) =>
  (global.fetch as jest.Mock).mock.calls
    .map((c) => c[0] as Request)
    .filter(
      (r) =>
        r.method === method &&
        path.test(new URL(r.url, 'http://localhost').pathname)
    );

// ── tests ─────────────────────────────────────────────────────────────────────

describe('CannedResponsesPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    window.confirm = jest.fn(() => true);
  });

  it('sends GET /api/staff-inbox/responses on mount', async () => {
    setupFetch();
    renderWithProviders(<CannedResponsesPage />);

    await waitFor(() => {
      expect(
        getRequestsTo('GET', /\/api\/staff-inbox\/responses$/).length
      ).toBeGreaterThan(0);
    });
  });

  it('shows a spinner while loading', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => undefined)
    );
    renderWithProviders(<CannedResponsesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no responses exist', async () => {
    setupFetch({ responses: [] });
    renderWithProviders(<CannedResponsesPage />);
    expect(
      await screen.findByText(/no canned responses yet/i)
    ).toBeInTheDocument();
  });

  it('renders response cards with name and body text', async () => {
    setupFetch({
      responses: [makeResponse_(1, { name: 'Greeting', body: 'Hello there!' })]
    });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText('Greeting');
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('toggles the create form when "New Response" is clicked', async () => {
    const user = userEvent.setup();
    setupFetch({ responses: [] });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText(/no canned responses yet/i);

    await user.click(screen.getByRole('button', { name: /new response/i }));
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^body$/i)).toBeInTheDocument();

    // Clicking again (now shows "Cancel") hides the form
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByLabelText(/^name$/i)).toBeNull();
  });

  it('submits the create form and sends a POST request', async () => {
    const user = userEvent.setup();
    setupFetch({ responses: [] });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText(/no canned responses yet/i);
    await user.click(screen.getByRole('button', { name: /new response/i }));

    await user.type(screen.getByLabelText(/^name$/i), 'Helpful Reply');
    await user.type(
      screen.getByLabelText(/^body$/i),
      'Thank you for contacting us.'
    );
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      const posts = getRequestsTo('POST', /\/api\/staff-inbox\/responses$/);
      expect(posts.length).toBe(1);
    });
  });

  it('shows the edit form when Edit is clicked', async () => {
    const user = userEvent.setup();
    setupFetch({ responses: [makeResponse_(3, { name: 'Old Name' })] });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText('Old Name');
    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('cancels editing when Cancel is clicked in the edit form', async () => {
    const user = userEvent.setup();
    setupFetch({ responses: [makeResponse_(4, { name: 'Editable' })] });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText('Editable');
    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    // After cancel, the view card should be back
    expect(screen.getByText('Editable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^save$/i })).toBeNull();
  });

  it('submits an update and sends a PUT request', async () => {
    const user = userEvent.setup();
    setupFetch({ responses: [makeResponse_(5, { name: 'Original' })] });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText('Original');
    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    const nameInput = screen.getByDisplayValue('Original');
    await user.clear(nameInput);
    await user.type(nameInput, 'Revised');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      const puts = getRequestsTo('PUT', /\/api\/staff-inbox\/responses\/5$/);
      expect(puts.length).toBe(1);
    });
  });

  it('sends a DELETE request when Delete is confirmed', async () => {
    const user = userEvent.setup();
    setupFetch({ responses: [makeResponse_(6)] });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText('Response 6');
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      const deletes = getRequestsTo(
        'DELETE',
        /\/api\/staff-inbox\/responses\/6$/
      );
      expect(deletes.length).toBe(1);
    });
  });

  it('skips DELETE when the confirm dialog is rejected', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);
    setupFetch({ responses: [makeResponse_(7)] });
    renderWithProviders(<CannedResponsesPage />);

    await screen.findByText('Response 7');
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(
        getRequestsTo('DELETE', /\/api\/staff-inbox\/responses\/7$/).length
      ).toBe(0);
    });
  });
});
