import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import StaffGroupsPage from '../../components/staff/StaffGroupsPage';

const mockQuery = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetStaffGroupsQuery: () => mockQuery(),
  useCreateStaffGroupMutation: () => [mockCreate, { isLoading: false }],
  useUpdateStaffGroupMutation: () => [mockUpdate, { isLoading: false }],
  useDeleteStaffGroupMutation: () => [mockDelete, { isLoading: false }]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

const makeGroup = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  name: `Group ${id}`,
  sortOrder: id,
  rankCount: 0,
  ...over
});

describe('StaffGroupsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUpdate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows a spinner while loading', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<StaffGroupsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<StaffGroupsPage />);
    expect(screen.getByText('No staff groups yet.')).toBeInTheDocument();
  });

  it('renders groups on the grid table (kit hooks present)', () => {
    mockQuery.mockReturnValue({
      data: [makeGroup(1), makeGroup(2)],
      isLoading: false
    });
    renderWithProviders(<StaffGroupsPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
  });

  it('creates a group from the new-group form', async () => {
    mockQuery.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<StaffGroupsPage />);
    await user.type(screen.getByLabelText(/^name$/i), 'Moderation');
    await user.click(screen.getByRole('button', { name: /^create$/i }));
    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Moderation',
      sortOrder: 0
    });
  });

  it('reveals an inline input when editing a group', async () => {
    mockQuery.mockReturnValue({ data: [makeGroup(1)], isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<StaffGroupsPage />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByDisplayValue('Group 1')).toBeInTheDocument();
  });

  it('deletes a group with no assigned ranks', async () => {
    mockQuery.mockReturnValue({
      data: [makeGroup(4, { rankCount: 0 })],
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<StaffGroupsPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDelete).toHaveBeenCalledWith(4);
  });

  it('blocks deletion when ranks are still assigned', async () => {
    mockQuery.mockReturnValue({
      data: [makeGroup(5, { rankCount: 3 })],
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<StaffGroupsPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });
});
