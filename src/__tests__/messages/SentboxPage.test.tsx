import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SentboxPage from '../../components/messages/SentboxPage';
import { renderWithProviders } from '../testUtils';

const mockUseGetSentboxQuery = jest.fn();

jest.mock('../../store/services/messagesApi', () => ({
  useGetSentboxQuery: (...args: unknown[]) => mockUseGetSentboxQuery(...args)
}));

describe('SentboxPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetSentboxQuery.mockReturnValue({
      data: {
        total: 30,
        page: 1,
        pageSize: 25,
        conversations: [
          {
            id: 3,
            subject: 'Sent subject',
            participants: [{ sentAt: '2026-05-17T12:00:00.000Z' }],
            messages: [{ body: 'A very long message body' }]
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
  });

  it('renders sent messages and paginates queries', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SentboxPage />);

    expect(mockUseGetSentboxQuery).toHaveBeenCalledWith({ page: 1 });
    expect(screen.getByRole('link', { name: 'Sent subject' })).toHaveAttribute(
      'href',
      '/private/messages/3'
    );
    expect(screen.getByText(/a very long message body/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockUseGetSentboxQuery).toHaveBeenLastCalledWith({ page: 2 });
  });

  it('navigates back to page 1 when Previous is clicked from page 2', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SentboxPage />);

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockUseGetSentboxQuery).toHaveBeenLastCalledWith({ page: 2 });

    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(mockUseGetSentboxQuery).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('shows empty and error states', () => {
    mockUseGetSentboxQuery.mockReturnValue({
      data: { total: 0, page: 1, pageSize: 25, conversations: [] },
      isLoading: false,
      error: undefined
    });

    const { rerender } = renderWithProviders(<SentboxPage />);
    expect(screen.getByText('No sent messages.')).toBeInTheDocument();

    mockUseGetSentboxQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    rerender(<SentboxPage />);
    expect(
      screen.getByText('Failed to load sent messages.')
    ).toBeInTheDocument();
  });
});
