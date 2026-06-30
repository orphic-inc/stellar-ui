import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ForumControlPanel from '../../components/admin/ForumControlPanel';

const mockGetForumCategoriesQuery = jest.fn();
const mockGetForumsQuery = jest.fn();
const mockCreateForum = jest.fn();
const mockUpdateForum = jest.fn();
const mockDeleteForum = jest.fn();

jest.mock('../../store/services/forumApi', () => ({
  useGetForumCategoriesQuery: () => mockGetForumCategoriesQuery(),
  useGetForumsQuery: () => mockGetForumsQuery(),
  useCreateForumMutation: () => [mockCreateForum, { isLoading: false }],
  useUpdateForumMutation: () => [mockUpdateForum, { isLoading: false }],
  useDeleteForumMutation: () => [mockDeleteForum]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const categories = [
  { id: 1, name: 'General', sort: 1 },
  { id: 2, name: 'Music Talk', sort: 2 }
];

const forums = [
  {
    id: 10,
    name: 'Site News',
    sort: 1,
    numTopics: 5,
    numPosts: 20,
    forumCategory: { name: 'General' }
  }
];

describe('ForumControlPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForumCategoriesQuery.mockReturnValue({
      data: categories,
      isLoading: false,
      error: undefined
    });
    mockGetForumsQuery.mockReturnValue({
      data: forums,
      isLoading: false,
      error: undefined
    });
    mockCreateForum.mockResolvedValue({ data: { id: 11 } });
  });

  it('shows spinner while loading', () => {
    mockGetForumCategoriesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ForumControlPanel />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when load fails', () => {
    mockGetForumsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByText(/failed to load forums/i)).toBeInTheDocument();
  });

  it('renders existing forum in table', () => {
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByRole('link', { name: 'Site News' })).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
  });

  it('emits the data-st contract via the kit (table grid + field)', () => {
    const { container } = renderWithProviders(<ForumControlPanel />);
    expect(
      container.querySelector('table[data-st="grid"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('thead[data-st="colhead"]')
    ).toBeInTheDocument();
    expect(container.querySelector('tr[data-st="row"]')).toBeInTheDocument();
    expect(
      container.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
  });

  it('shows "no forums yet" empty state', () => {
    mockGetForumsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByText(/no forums yet/i)).toBeInTheDocument();
  });

  it('renders category dropdown with options', () => {
    renderWithProviders(<ForumControlPanel />);
    expect(screen.getByRole('option', { name: 'General' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Music Talk' })
    ).toBeInTheDocument();
  });

  it('updates optional form fields: sort, description, and access levels', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForumControlPanel />);

    const sortInput = screen.getByLabelText(/sort order/i) as HTMLInputElement;
    await user.clear(sortInput);
    await user.type(sortInput, '5');
    expect(sortInput.value).toBe('5');

    const descInput = screen.getByLabelText(/description/i) as HTMLInputElement;
    await user.type(descInput, 'A test description');
    expect(descInput.value).toBe('A test description');

    const readInput = screen.getByLabelText(/^read$/i) as HTMLInputElement;
    await user.clear(readInput);
    await user.type(readInput, '100');
    expect(readInput.value).toBe('100');

    const writeInput = screen.getByLabelText(/^write$/i) as HTMLInputElement;
    await user.clear(writeInput);
    await user.type(writeInput, '200');
    expect(writeInput.value).toBe('200');

    const createInput = screen.getByLabelText(
      /create topics/i
    ) as HTMLInputElement;
    await user.clear(createInput);
    await user.type(createInput, '300');
    expect(createInput.value).toBe('300');
  });

  it('calls createForum with correct payload on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForumControlPanel />);
    await user.selectOptions(screen.getByLabelText(/^category/i), 'General');
    await user.type(screen.getByLabelText(/^name/i), 'Intro Forum');
    await user.click(screen.getByRole('button', { name: /create forum/i }));
    await waitFor(() => {
      expect(mockCreateForum).toHaveBeenCalledWith(
        expect.objectContaining({
          forumCategoryId: 1,
          name: 'Intro Forum'
        })
      );
    });
  });
});
