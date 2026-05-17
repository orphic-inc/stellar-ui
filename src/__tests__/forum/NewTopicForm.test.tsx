import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import NewTopicForm from '../../components/forum/NewTopicForm';

const mockUseGetForumByIdQuery = jest.fn();
const mockCreateTopic = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/forumApi', () => ({
  useGetForumByIdQuery: (...args: unknown[]) =>
    mockUseGetForumByIdQuery(...args),
  useCreateTopicMutation: () => [mockCreateTopic, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ forumId: '9' }),
  useNavigate: () => mockNavigate
}));

describe('NewTopicForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    await user.click(screen.getByRole('button', { name: /^show$/i }));
    const pollInputs = screen.getAllByRole('textbox');
    await user.type(pollInputs[2], 'Best format?');
    await user.type(pollInputs[3], 'CD');
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.type(screen.getAllByRole('textbox')[4], 'Vinyl');
    await user.click(screen.getByDisplayValue(/create thread/i));

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
    await user.click(screen.getByDisplayValue(/create thread/i));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Topic locked')).toBe(true);
    });
  });
});
