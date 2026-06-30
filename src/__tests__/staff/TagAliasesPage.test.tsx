import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TagAliasesPage from '../../components/staff/TagAliasesPage';

const mockQuery = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../store/services/tagAliasApi', () => ({
  useGetTagAliasesQuery: () => mockQuery(),
  useCreateTagAliasMutation: () => [mockCreate, { isLoading: false }],
  useUpdateTagAliasMutation: () => [mockUpdate, { isLoading: false }],
  useDeleteTagAliasMutation: () => [mockDelete, { isLoading: false }]
}));

const makeAlias = (id: number) => ({
  id,
  badTag: `bad${id}`,
  goodTag: { name: `good${id}` },
  createdAt: '2026-01-02T00:00:00.000Z'
});

describe('TagAliasesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({ data: {} });
  });

  it('shows a spinner while loading', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<TagAliasesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders aliases on the grid table (kit hooks present)', () => {
    mockQuery.mockReturnValue({
      data: { data: [makeAlias(1)], meta: { page: 1, totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<TagAliasesPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('bad1')).toBeInTheDocument();
    expect(screen.getByText('good1')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({
      data: { data: [], meta: { page: 1, totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<TagAliasesPage />);
    expect(screen.getByText('No aliases defined.')).toBeInTheDocument();
  });

  it('creates an alias from the in-table create row', async () => {
    mockQuery.mockReturnValue({
      data: { data: [], meta: { page: 1, totalPages: 1 } },
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<TagAliasesPage />);
    await user.type(screen.getByPlaceholderText('e.g. hip-hop'), 'hiphop');
    await user.type(screen.getByPlaceholderText('e.g. hip.hop'), 'hip.hop');
    await user.click(screen.getByRole('button', { name: /add alias/i }));
    expect(mockCreate).toHaveBeenCalledWith({
      badTag: 'hiphop',
      goodTag: 'hip.hop'
    });
  });

  it('deletes an alias via the Delete action', async () => {
    mockQuery.mockReturnValue({
      data: { data: [makeAlias(5)], meta: { page: 1, totalPages: 1 } },
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<TagAliasesPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDelete).toHaveBeenCalledWith(5);
  });

  it('shows the pager when there is more than one page', () => {
    mockQuery.mockReturnValue({
      data: { data: [makeAlias(1)], meta: { page: 1, totalPages: 3 } },
      isLoading: false
    });
    renderWithProviders(<TagAliasesPage />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});
