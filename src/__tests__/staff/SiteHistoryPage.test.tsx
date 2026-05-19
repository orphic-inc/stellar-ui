import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import SiteHistoryPage from '../../components/staff/SiteHistoryPage';

const mockUseGetSiteHistoryQuery = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/siteHistoryApi', () => ({
  useGetSiteHistoryQuery: () => mockUseGetSiteHistoryQuery(),
  useCreateSiteHistoryMutation: () => [mockCreate, { isLoading: false }],
  useUpdateSiteHistoryMutation: () => [mockUpdate, { isLoading: false }],
  useDeleteSiteHistoryMutation: () => [mockDelete, { isLoading: false }]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

const makeEntry = (id: number) => ({
  id,
  title: `Entry ${id}`,
  body: `Body of entry ${id}`,
  authorId: 7,
  createdAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-10T00:00:00.000Z',
  author: { id: 7, username: 'admin' }
});

describe('SiteHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUpdate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows spinner while loading', () => {
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error on failure', () => {
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<SiteHistoryPage />);
    expect(
      screen.getByText(/failed to load site history/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no entries exist', () => {
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    expect(screen.getByText(/no site history entries/i)).toBeInTheDocument();
  });

  it('renders entries with title, body, and action buttons', () => {
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [makeEntry(1), makeEntry(2)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    expect(screen.getByText('Entry 1')).toBeInTheDocument();
    expect(screen.getByText('Body of entry 1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /edit/i }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBe(2);
  });

  it('opens new entry modal on + Add Entry click', async () => {
    const user = userEvent.setup();
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    await user.click(screen.getByRole('button', { name: /\+ add entry/i }));
    expect(screen.getByText('New Entry')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('opens edit modal with prefilled title on edit click', async () => {
    const user = userEvent.setup();
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [makeEntry(5)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByText('Edit Entry')).toBeInTheDocument();
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe(
      'Entry 5'
    );
  });

  it('calls create when new entry is submitted', async () => {
    const user = userEvent.setup();
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    await user.click(screen.getByRole('button', { name: /\+ add entry/i }));
    await user.type(screen.getByLabelText(/title/i), 'Site Launch');
    await user.type(
      screen.getByLabelText(/body/i),
      'We launched the site today.'
    );
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(mockCreate).toHaveBeenCalledWith({
      title: 'Site Launch',
      body: 'We launched the site today.'
    });
  });

  it('calls update when edit modal is saved', async () => {
    const user = userEvent.setup();
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [makeEntry(5)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Revised title');
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, title: 'Revised title' })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'success' })
      })
    );
  });

  it('dispatches danger alert when save fails', async () => {
    mockCreate.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Server error.' } })
    });
    const user = userEvent.setup();
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    await user.click(screen.getByRole('button', { name: /\+ add entry/i }));
    await user.type(screen.getByLabelText(/title/i), 'Bad');
    await user.type(screen.getByLabelText(/body/i), 'Bad body.');
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('dispatches danger alert when delete fails', async () => {
    mockDelete.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Server error.' } })
    });
    const user = userEvent.setup();
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [makeEntry(9)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('calls deleteEntry after confirm', async () => {
    const user = userEvent.setup();
    mockUseGetSiteHistoryQuery.mockReturnValue({
      data: [makeEntry(7)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<SiteHistoryPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith(7);
    expect(mockDispatch).toHaveBeenCalled();
  });
});
