import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTopicForm from '../../components/forum/NewTopicForm';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import { createTestStore, renderWithProviders } from '../testUtils';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ forumId: '9' }),
  useNavigate: () => mockNavigate
}));

describe('NewTopicForm RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockImplementation((request: Request) => {
      const url = new URL(request.url, 'http://localhost');

      if (url.pathname === '/api/forums/9') {
        return Promise.resolve(
          makeResponse({
            body: { id: 9, name: 'Jazz Forum' }
          })
        );
      }

      return Promise.resolve(
        makeResponse({
          status: 404,
          body: { msg: `Unhandled request: ${request.method} ${url.pathname}` }
        })
      );
    });
  });

  it('creates a topic with a filtered poll payload through RTK Query and navigates to the new topic', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementation(async (request: Request) => {
      const url = new URL(request.url, 'http://localhost');

      if (url.pathname === '/api/forums/9') {
        return makeResponse({ body: { id: 9, name: 'Jazz Forum' } });
      }

      if (
        url.pathname === '/api/forums/9/topics' &&
        request.method === 'POST'
      ) {
        return makeResponse({
          status: 201,
          body: { id: 77, title: 'Favorite pressings' }
        });
      }

      return makeResponse({
        status: 404,
        body: { msg: `Unhandled request: ${request.method} ${url.pathname}` }
      });
    });

    renderWithProviders(<NewTopicForm />);

    const textboxes = await screen.findAllByRole('textbox');
    await user.type(textboxes[0], 'Favorite pressings');
    await user.type(textboxes[1], 'Share your picks');
    await user.click(screen.getByRole('button', { name: /add a poll/i }));

    const pollInputs = screen.getAllByRole('textbox');
    await user.type(pollInputs[2], 'Best format?');
    await user.type(pollInputs[3], 'CD');
    await user.click(screen.getByRole('button', { name: /add answer/i }));
    await user.type(screen.getAllByRole('textbox')[4], '   ');
    await user.click(screen.getByRole('button', { name: /add answer/i }));
    await user.type(screen.getAllByRole('textbox')[5], 'Vinyl');
    await user.click(screen.getByRole('button', { name: /create thread/i }));

    await waitFor(async () => {
      const request = (global.fetch as jest.Mock).mock.calls.find(
        (call) =>
          (call[0] as Request).url.includes('/api/forums/9/topics') &&
          (call[0] as Request).method === 'POST'
      )?.[0] as Request | undefined;

      expect(request).toBeDefined();
      expect(await request?.text()).toBe(
        JSON.stringify({
          title: 'Favorite pressings',
          body: 'Share your picks',
          question: 'Best format?',
          answers: JSON.stringify(['CD', 'Vinyl'])
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/forums/9/topics/77');
    });
  });

  it('shows server errors from the real create-topic mutation', async () => {
    const user = userEvent.setup();
    const store = createTestStore();

    (global.fetch as jest.Mock).mockImplementation(async (request: Request) => {
      const url = new URL(request.url, 'http://localhost');

      if (url.pathname === '/api/forums/9') {
        return makeResponse({ body: { id: 9, name: 'Jazz Forum' } });
      }

      if (
        url.pathname === '/api/forums/9/topics' &&
        request.method === 'POST'
      ) {
        return makeResponse({
          status: 500,
          body: { msg: 'Topic locked' }
        });
      }

      return makeResponse({
        status: 404,
        body: { msg: `Unhandled request: ${request.method} ${url.pathname}` }
      });
    });

    renderWithProviders(<NewTopicForm />, { store });

    const textboxes = await screen.findAllByRole('textbox');
    await user.type(textboxes[0], 'Blocked');
    await user.type(textboxes[1], 'Cannot post');
    await user.click(screen.getByRole('button', { name: /create thread/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((alert) => alert.msg === 'Topic locked')).toBe(true);
    });
  });
});
