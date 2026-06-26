import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import NewTopicForm from '../../components/forum/NewTopicForm';

const mockUseGetForumByIdQuery = jest.fn();
const mockCreateTopic = jest.fn();
const mockNavigate = jest.fn();
let mockForumId: string | undefined = '9';

jest.mock('../../store/services/forumApi', () => ({
  useGetForumByIdQuery: (...args: unknown[]) =>
    mockUseGetForumByIdQuery(...args),
  useCreateTopicMutation: () => [mockCreateTopic, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ forumId: mockForumId }),
  useNavigate: () => mockNavigate
}));

describe('NewTopicForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForumId = '9';
    mockUseGetForumByIdQuery.mockReturnValue({
      data: { id: 9, name: 'Jazz Forum' }
    });
    mockCreateTopic.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 77 })
    });
  });

  it('creates a topic with poll payload when poll settings are filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewTopicForm />);
    const textboxes = screen.getAllByRole('textbox');

    await user.type(textboxes[0], 'Favorite pressings');
    await user.type(textboxes[1], 'Share your picks');
    await user.click(screen.getByRole('button', { name: /add a poll/i }));
    const pollInputs = screen.getAllByRole('textbox');
    await user.type(pollInputs[2], 'Best format?');
    await user.type(pollInputs[3], 'CD');
    await user.click(screen.getByRole('button', { name: /add answer/i }));
    await user.type(screen.getAllByRole('textbox')[4], 'Vinyl');
    await user.click(screen.getByRole('button', { name: /create thread/i }));

    await waitFor(() => {
      expect(mockCreateTopic).toHaveBeenCalledWith({
        forumId: 9,
        title: 'Favorite pressings',
        body: 'Share your picks',
        question: 'Best format?',
        answers: JSON.stringify(['CD', 'Vinyl'])
      });
      expect(mockNavigate).toHaveBeenCalledWith('/private/forums/9/topics/77');
    });
  });

  it('removes an answer when "−" is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewTopicForm />);
    await user.click(screen.getByRole('button', { name: /add a poll/i }));
    await user.click(screen.getByRole('button', { name: /add answer/i }));
    expect(screen.getAllByRole('textbox').length).toBe(5);
    await user.click(screen.getByRole('button', { name: /remove answer/i }));
    expect(screen.getAllByRole('textbox').length).toBe(4);
  });

  it('uses forumId 0 fallback in query and submit when param is undefined', async () => {
    mockForumId = undefined;
    mockUseGetForumByIdQuery.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    renderWithProviders(<NewTopicForm />);
    expect(screen.getByText('Forum')).toBeInTheDocument();
    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Title');
    await user.type(textboxes[1], 'Body');
    await user.click(screen.getByRole('button', { name: /create thread/i }));
    await waitFor(() => {
      expect(mockCreateTopic).toHaveBeenCalledWith(
        expect.objectContaining({ forumId: 0 })
      );
    });
  });

  it('dispatches fallback alert when creation fails with no API message', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockCreateTopic.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    renderWithProviders(<NewTopicForm />, { store });
    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Title');
    await user.type(textboxes[1], 'Body text');
    await user.click(screen.getByRole('button', { name: /create thread/i }));
    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(
        alerts.some(
          (a) => a.msg === 'Failed to create topic. Please try again.'
        )
      ).toBe(true);
    });
  });

  it('shows an alert when topic creation fails', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockCreateTopic.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Topic locked' } })
    });

    renderWithProviders(<NewTopicForm />, { store });
    const textboxes = screen.getAllByRole('textbox');

    await user.type(textboxes[0], 'Blocked');
    await user.type(textboxes[1], 'Cannot post');
    await user.click(screen.getByRole('button', { name: /create thread/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Topic locked')).toBe(true);
    });
  });

  it('paints inputs and the submit CTA from the data-st contract (ADR-0006)', () => {
    const { container } = renderWithProviders(<NewTopicForm />);

    // Text inputs carry the field Role so they recolor under a token theme
    // instead of leaving dark "remainder" boxes on a light surface.
    expect(container.querySelectorAll('[data-st="field"]').length).toBe(2);
    expect(
      container.querySelector('[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
  });
});
