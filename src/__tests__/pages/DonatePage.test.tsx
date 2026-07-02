import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import DonatePage from '../../components/donate/DonatePage';

const mockUseGetDonorRanksQuery = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetDonorRanksQuery: () => mockUseGetDonorRanksQuery()
}));

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <DonatePage />
    </MemoryRouter>
  );

describe('DonatePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetDonorRanksQuery.mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Bronze',
          color: null,
          badge: null,
          minDonation: 5,
          expiresAfterDays: null,
          perks: { customIcon: true }
        }
      ],
      isLoading: false
    });
  });

  it('renders the donor rank with its perks', () => {
    renderPage();
    expect(screen.getByText('Bronze')).toBeInTheDocument();
    expect(screen.getByText('Custom donor icon')).toBeInTheDocument();
  });

  it('emits the data-st theming hooks', () => {
    const { container } = renderPage();
    expect(container.querySelector('[data-st="panel"]')).toBeTruthy();
    expect(
      container.querySelector('[data-st="prose"][data-st-strong]')
    ).toBeTruthy();
    expect(container.querySelector('[data-st="control"]')).toBeTruthy();
  });
});
