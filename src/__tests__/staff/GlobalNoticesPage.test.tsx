import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import GlobalNoticesPage from '../../components/staff/GlobalNoticesPage';

const mockQuery = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../store/services/announcementApi', () => ({
  useGetGlobalNoticesQuery: () => mockQuery(),
  useCreateGlobalNoticeMutation: () => [mockCreate, { isLoading: false }],
  useDeleteGlobalNoticeMutation: () => [mockDelete, { isLoading: false }]
}));

const makeNotice = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  message: `Notice ${id}`,
  url: `https://example.com/${id}`,
  expiresAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  ...over
});

describe('GlobalNoticesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows a spinner while loading', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<GlobalNoticesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<GlobalNoticesPage />);
    expect(screen.getByText('No notices.')).toBeInTheDocument();
  });

  it('renders notices on the grid table (kit hooks present)', () => {
    mockQuery.mockReturnValue({
      data: [makeNotice(1), makeNotice(2)],
      isLoading: false
    });
    renderWithProviders(<GlobalNoticesPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('Notice 1')).toBeInTheDocument();
    expect(screen.getByText('Notice 2')).toBeInTheDocument();
  });

  it('shows "Never" when a notice has no expiry', () => {
    mockQuery.mockReturnValue({
      data: [makeNotice(1, { expiresAt: null })],
      isLoading: false
    });
    renderWithProviders(<GlobalNoticesPage />);
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('submits the create form with the typed message', async () => {
    mockQuery.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<GlobalNoticesPage />);
    await user.type(
      screen.getByPlaceholderText(/message \(max 500/i),
      'Maintenance tonight'
    );
    await user.click(screen.getByRole('button', { name: /send notice/i }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Maintenance tonight' })
    );
  });

  it('deletes a notice via the Delete action', async () => {
    mockQuery.mockReturnValue({ data: [makeNotice(7)], isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<GlobalNoticesPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDelete).toHaveBeenCalledWith(7);
  });
});
