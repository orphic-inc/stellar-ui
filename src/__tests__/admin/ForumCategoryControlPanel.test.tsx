import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ForumCategoryControlPanel from '../../components/admin/ForumCategoryControlPanel';

const mockGetForumCategoriesAdminQuery = jest.fn();
const mockCreateForumCategory = jest.fn();
const mockUpdateForumCategory = jest.fn();
const mockDeleteForumCategory = jest.fn();

let mockIsCreating = false;

jest.mock('../../store/services/forumApi', () => ({
  useGetForumCategoriesAdminQuery: () => mockGetForumCategoriesAdminQuery(),
  useCreateForumCategoryMutation: () => [
    mockCreateForumCategory,
    { isLoading: mockIsCreating }
  ],
  useUpdateForumCategoryMutation: () => [mockUpdateForumCategory],
  useDeleteForumCategoryMutation: () => [mockDeleteForumCategory]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const makeCategory = (id: number) => ({
  id,
  name: `Category ${id}`,
  sort: id * 10
});

describe('ForumCategoryControlPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCreating = false;
    window.confirm = jest.fn().mockReturnValue(true);
    mockCreateForumCategory.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    mockUpdateForumCategory.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    mockDeleteForumCategory.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('shows spinner while loading', () => {
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('renders category names in table', () => {
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [makeCategory(1), makeCategory(2)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  it('creates a new category on form submit', async () => {
    const user = userEvent.setup();
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    await user.type(screen.getByLabelText(/name/i), 'Jazz Talk');
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    expect(mockCreateForumCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jazz Talk' })
    );
  });

  it('shows edit form on Edit click and saves on submit', async () => {
    const user = userEvent.setup();
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [makeCategory(1)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const nameInput = screen.getByDisplayValue('Category 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(mockUpdateForumCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Name' })
    );
  });

  it('hides edit form on Cancel', async () => {
    const user = userEvent.setup();
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [makeCategory(1)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByDisplayValue('Category 1')).not.toBeInTheDocument();
  });

  it('shows "Creating…" when isCreating is true', () => {
    mockIsCreating = true;
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    expect(
      screen.getByRole('button', { name: /creating…/i })
    ).toBeInTheDocument();
  });

  it('saves with sort=0 when sort field is cleared (parseInt NaN fallback)', async () => {
    const user = userEvent.setup();
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [makeCategory(1)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const sortInputs = screen.getAllByRole('spinbutton');
    await user.clear(sortInputs[0]);
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(mockUpdateForumCategory).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 0 })
    );
  });

  it('updates sort value in create form', async () => {
    const user = userEvent.setup();
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    const sortInput = screen.getByLabelText(/sort order/i) as HTMLInputElement;
    await user.clear(sortInput);
    await user.type(sortInput, '50');
    expect(sortInput.value).toBe('50');
  });

  it('updates sort value in edit form', async () => {
    const user = userEvent.setup();
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [makeCategory(1)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const sortInputs = screen.getAllByRole('spinbutton');
    await user.clear(sortInputs[0]);
    await user.type(sortInputs[0], '99');
    expect((sortInputs[0] as HTMLInputElement).value).toBe('99');
  });

  it('calls deleteCategory after confirm', async () => {
    const user = userEvent.setup();
    mockGetForumCategoriesAdminQuery.mockReturnValue({
      data: [makeCategory(3)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ForumCategoryControlPanel />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteForumCategory).toHaveBeenCalledWith(3);
  });
});
