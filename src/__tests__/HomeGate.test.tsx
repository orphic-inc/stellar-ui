import { screen } from '@testing-library/react';
import { renderWithProviders, createTestStore } from './testUtils';
import HomeGate from '../components/HomeGate';
import { setCredentials } from '../store/slices/authSlice';

const mockUseGetMeQuery = jest.fn();

jest.mock('../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('../components/pages/public/PublicLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="public-layout">{children}</div>
  )
}));

jest.mock('../components/pages/public/PublicLanding', () => ({
  __esModule: true,
  default: () => <div>Public Landing</div>
}));

jest.mock('../components/pages/private/layout/PrivateLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="private-layout">{children}</div>
  )
}));

jest.mock('../components/pages/private/layout/PrivateContent', () => ({
  __esModule: true,
  default: () => <div>Private Content</div>
}));

jest.mock('../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />
}));

describe('HomeGate', () => {
  beforeEach(() => {
    mockUseGetMeQuery.mockReset();
  });

  it('shows a spinner while the session probe is in flight', () => {
    mockUseGetMeQuery.mockReturnValue({
      isUninitialized: false,
      isLoading: true,
      data: undefined
    });

    renderWithProviders(<HomeGate />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders the public landing for visitors', () => {
    mockUseGetMeQuery.mockReturnValue({
      isUninitialized: false,
      isLoading: false,
      data: undefined
    });

    renderWithProviders(<HomeGate />);

    expect(screen.getByText('Public Landing')).toBeInTheDocument();
    expect(screen.queryByTestId('private-layout')).not.toBeInTheDocument();
  });

  it('renders the private app for authenticated members', () => {
    mockUseGetMeQuery.mockReturnValue({
      isUninitialized: false,
      isLoading: false,
      data: { id: 1 }
    });
    const store = createTestStore();
    store.dispatch(setCredentials({ id: 1 } as never));

    renderWithProviders(<HomeGate />, { store });

    expect(screen.getByTestId('private-layout')).toBeInTheDocument();
    expect(screen.getByText('Private Content')).toBeInTheDocument();
    expect(screen.queryByText('Public Landing')).not.toBeInTheDocument();
  });
});
