import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createTestStore } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import MyStylesheetsPage from '../../components/stylesheets/MyStylesheetsPage';

const mockList = jest.fn();
const mockDelete = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/stylesheetApi', () => ({
  useListAuthorStylesheetsQuery: (...args: unknown[]) => mockList(...args),
  useDeleteAuthorStylesheetMutation: () => [mockDelete]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const sheet = (id: number, name: string) => ({
  id,
  authorId: 7,
  name,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z'
});

const listOf = (rows: ReturnType<typeof sheet>[]) =>
  mockList.mockReturnValue({
    data: {
      data: rows,
      meta: { total: rows.length, page: 1, limit: 25, totalPages: 1 }
    },
    isLoading: false
  });

const renderAs = (authorStylesheetLimit: number | null) => {
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: 7,
      username: 'kai',
      userRank: {
        name: 'User',
        level: 100,
        permissions: {},
        authorStylesheetLimit
      }
    } as never)
  );
  renderWithProviders(<MyStylesheetsPage />, { store });
};

describe('MyStylesheetsPage (#450)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve() });
  });

  it("lists the member's own sheets with the space they use", () => {
    listOf([sheet(1, 'Dusk'), sheet(2, 'Dawn')]);
    renderAs(5);
    expect(mockList).toHaveBeenCalledWith(
      { userId: 7, page: 1 },
      { skip: false }
    );
    expect(screen.getByRole('link', { name: 'Dusk' })).toHaveAttribute(
      'href',
      '/stylesheets/1/edit'
    );
    expect(
      screen.getByText('2 of 5 stylesheet spaces used')
    ).toBeInTheDocument();
  });

  it('opens the editor from New while a space is free', async () => {
    const user = userEvent.setup();
    listOf([sheet(1, 'Dusk')]);
    renderAs(5);
    await user.click(screen.getByRole('button', { name: /new stylesheet/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/stylesheets/new');
  });

  it('disables New at the cap and says why', () => {
    listOf([sheet(1, 'Dusk'), sheet(2, 'Dawn')]);
    renderAs(2);
    expect(
      screen.getByRole('button', { name: /new stylesheet/i })
    ).toBeDisabled();
    expect(
      screen.getByText('All 2 spaces are in use. Deleting one frees a space.')
    ).toBeInTheDocument();
  });

  it('still lists sheets for a class with no spaces, with New disabled', () => {
    listOf([sheet(1, 'Dusk')]);
    renderAs(0);
    expect(screen.getByRole('link', { name: 'Dusk' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new stylesheet/i })
    ).toBeDisabled();
    expect(
      screen.getByText("Your class doesn't include stylesheet spaces.")
    ).toBeInTheDocument();
  });

  it('shows no limit for an unlimited class', () => {
    listOf([sheet(1, 'Dusk')]);
    renderAs(null);
    expect(screen.getByText('1 stylesheet (no limit)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new stylesheet/i })
    ).toBeEnabled();
  });

  it('deletes after a confirmation that says adopters keep it', async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    listOf([sheet(1, 'Dusk')]);
    renderAs(5);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirmSpy).toHaveBeenCalledWith(
      'Delete Dusk? This frees a space. Members who adopted it keep it until they switch away.'
    );
    expect(mockDelete).toHaveBeenCalledWith(1);
    confirmSpy.mockRestore();
  });

  it('deletes nothing when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    listOf([sheet(1, 'Dusk')]);
    renderAs(5);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(mockDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
