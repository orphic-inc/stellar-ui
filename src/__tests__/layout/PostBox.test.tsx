import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import PostBox from '../../components/layout/PostBox';

const mockCreatePost = jest.fn();
const mockDispatch = jest.fn();
let mockIsLoading = false;

jest.mock('../../store/services/forumApi', () => ({
  useCreatePostMutation: () => [mockCreatePost, { isLoading: mockIsLoading }]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

describe('PostBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoading = false;
    mockCreatePost.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 1 })
    });
  });

  it('renders Post Reply button and body textarea', () => {
    renderWithProviders(<PostBox forumId="1" topicId="10" />);
    expect(
      screen.getByRole('button', { name: /post reply/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls createPost with forumId, topicId, and body on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PostBox forumId="2" topicId="20" />);
    await user.type(screen.getByRole('textbox'), 'Great topic!');
    await user.click(screen.getByRole('button', { name: /post reply/i }));
    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith({
        forumId: 2,
        topicId: 20,
        body: 'Great topic!'
      });
    });
  });

  it('clears body after successful submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PostBox forumId="1" topicId="5" />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My reply');
    await user.click(screen.getByRole('button', { name: /post reply/i }));
    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('dispatches danger alert when createPost fails', async () => {
    mockCreatePost.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Forum locked.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<PostBox forumId="1" topicId="5" />);
    await user.type(screen.getByRole('textbox'), 'Oops');
    await user.click(screen.getByRole('button', { name: /post reply/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });

  it('dispatches fallback danger alert when rejection has no API message', async () => {
    mockCreatePost.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<PostBox forumId="1" topicId="5" />);
    await user.type(screen.getByRole('textbox'), 'Oops');
    await user.click(screen.getByRole('button', { name: /post reply/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Failed to post reply.',
            alertType: 'danger'
          })
        })
      );
    });
  });

  it('shows "Posting…" button label when isLoading is true', () => {
    mockIsLoading = true;
    renderWithProviders(<PostBox forumId="1" topicId="5" />);
    expect(
      screen.getByRole('button', { name: /posting…/i })
    ).toBeInTheDocument();
  });

  it('prepopulates body with quoteText when provided', () => {
    const mockConsumed = jest.fn();
    renderWithProviders(
      <PostBox
        forumId="1"
        topicId="5"
        quoteText="[quote]Some text[/quote]"
        onQuoteConsumed={mockConsumed}
      />
    );
    expect(
      (screen.getByRole('textbox') as HTMLTextAreaElement).value
    ).toContain('[quote]Some text[/quote]');
  });
});
