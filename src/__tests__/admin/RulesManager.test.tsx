import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import RulesManager from '../../components/admin/RulesManager';

const mockGetRulesIndexQuery = jest.fn();
const mockCreatePage = jest.fn();
const mockUpdatePage = jest.fn();
const mockDeletePage = jest.fn();

jest.mock('../../store/services/rulesApi', () => ({
  useGetRulesIndexQuery: () => mockGetRulesIndexQuery(),
  useCreateRulesPageMutation: () => [mockCreatePage, { isLoading: false }],
  useUpdateRulesPageMutation: () => [mockUpdatePage, { isLoading: false }],
  useDeleteRulesPageMutation: () => [mockDeletePage, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const makeSubPage = (id: number, title: string, slug: string) => ({
  id,
  title,
  body: `Body for ${title}`,
  slug,
  sortOrder: id
});

describe('RulesManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePage.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUpdatePage.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDeletePage.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows a spinner while loading', () => {
    mockGetRulesIndexQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<RulesManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders sub-pages on the grid table (kit hooks present)', () => {
    mockGetRulesIndexQuery.mockReturnValue({
      data: {
        main: {
          id: 1,
          title: 'Main',
          body: 'Main body',
          slug: 'main',
          sortOrder: 0
        },
        pages: [makeSubPage(2, 'Uploading', 'uploading')]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<RulesManager />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('Uploading')).toBeInTheDocument();
    expect(screen.getByText('uploading')).toBeInTheDocument();
  });

  it('shows the sub-pages empty state', () => {
    mockGetRulesIndexQuery.mockReturnValue({
      data: { main: null, pages: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<RulesManager />);
    expect(screen.getByText(/no sub-pages yet/i)).toBeInTheDocument();
  });

  it('shows the error state', () => {
    mockGetRulesIndexQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<RulesManager />);
    expect(screen.getByText(/failed to load sub-pages/i)).toBeInTheDocument();
  });

  it('reveals the create sub-page form on toggle', async () => {
    const user = userEvent.setup();
    mockGetRulesIndexQuery.mockReturnValue({
      data: { main: null, pages: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<RulesManager />);
    await user.click(screen.getByRole('button', { name: /\+ new sub-page/i }));
    expect(
      screen.getByRole('button', { name: /create sub-page/i })
    ).toBeInTheDocument();
  });

  it('deletes a sub-page after confirm', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn().mockReturnValue(true);
    mockGetRulesIndexQuery.mockReturnValue({
      data: { main: null, pages: [makeSubPage(7, 'Stale', 'stale')] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<RulesManager />);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeletePage).toHaveBeenCalledWith(7);
  });

  it('opens the inline edit row on Edit', async () => {
    const user = userEvent.setup();
    mockGetRulesIndexQuery.mockReturnValue({
      data: { main: null, pages: [makeSubPage(3, 'Editme', 'editme')] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<RulesManager />);
    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByText(/edit: editme/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save changes/i })
    ).toBeInTheDocument();
  });
});
