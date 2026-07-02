import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import UserWarningsPage from '../../components/staff/UserWarningsPage';

const mockUseGetAllWarningsQuery = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetAllWarningsQuery: (...args: unknown[]) =>
    mockUseGetAllWarningsQuery(...args)
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <UserWarningsPage />
    </MemoryRouter>
  );

describe('UserWarningsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetAllWarningsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            userId: 7,
            reason: 'Spamming the forums',
            user: { id: 7, username: 'alice' },
            warnedBy: { id: 2, username: 'mod' },
            createdAt: '2026-06-01T00:00:00.000Z',
            expiresAt: null
          }
        ],
        meta: { total: 1, page: 1, limit: 25, totalPages: 1 }
      },
      isLoading: false
    });
  });

  it('renders a warning row with user and reason', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'alice' })).toBeInTheDocument();
    expect(screen.getByText('Spamming the forums')).toBeInTheDocument();
  });

  it('shows the empty state when there are no warnings', () => {
    mockUseGetAllWarningsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 25, totalPages: 1 } },
      isLoading: false
    });
    renderPage();
    expect(screen.getByText(/no warnings found/i)).toBeInTheDocument();
  });

  it('adopts the kit — emits a data-st grid table', () => {
    const { container } = renderPage();
    expect(container.querySelector('table[data-st="grid"]')).toBeTruthy();
    expect(container.querySelector('input[data-st="field"]')).toBeTruthy();
    expect(
      container.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeTruthy();
  });
});
