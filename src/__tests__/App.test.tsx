import React, { useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  useNavigate,
  type NavigateFunction
} from 'react-router-dom';
import App from '../components/App';
import { setCredentials } from '../store/slices/authSlice';
import { createTestStore, renderWithProviders } from './testUtils';

const mockUseGetInstallStatusQuery = jest.fn();
const mockUseGetMeQuery = jest.fn();

jest.mock('../store/services/installApi', () => ({
  useGetInstallStatusQuery: () => mockUseGetInstallStatusQuery()
}));

// HomeGate, now the element for "/" and every private path, reads the session.
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

jest.mock('../components/pages/public/Install', () => ({
  __esModule: true,
  default: () => <div>Install Page</div>
}));

jest.mock('../components/auth/Login', () => ({
  __esModule: true,
  default: () => <div>Login Page</div>
}));

jest.mock('../components/auth/Register', () => ({
  __esModule: true,
  default: () => <div>Register Page</div>
}));

jest.mock('../components/auth/Recovery', () => ({
  __esModule: true,
  default: () => <div>Recovery Page</div>
}));

// Counts mounts: the member's layout must be one instance for the session.
let mockPrivateLayoutMounts = 0;
jest.mock('../components/pages/private/layout/PrivateLayout', () => {
  const { useEffect: useMountEffect } = jest.requireActual('react');
  const MockPrivateLayout = ({ children }: { children: React.ReactNode }) => {
    useMountEffect(() => {
      mockPrivateLayoutMounts += 1;
    }, []);
    return <div data-testid="private-layout">{children}</div>;
  };
  return { __esModule: true, default: MockPrivateLayout };
});

jest.mock('../components/pages/private/layout/PrivateContent', () => ({
  __esModule: true,
  default: () => <div>Private Content</div>
}));

const renderApp = (initialEntries: string[] = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );

const memberStore = () => {
  const store = createTestStore();
  store.dispatch(setCredentials({ id: 1 } as never));
  return store;
};

describe('App', () => {
  beforeEach(() => {
    mockUseGetInstallStatusQuery.mockReset();
    mockUseGetMeQuery.mockReturnValue({
      isUninitialized: false,
      isLoading: false,
      data: { id: 1 }
    });
    mockPrivateLayoutMounts = 0;
  });

  it('shows the loading state while install status is loading', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined
    });

    renderApp();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the server error state when install status fails', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined
    });

    renderApp();

    expect(
      screen.getByText('Could not reach server. Please try again later.')
    ).toBeInTheDocument();
  });

  it('forces the app into install mode when setup is incomplete', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { installed: false }
    });

    renderApp(['/login']);

    expect(screen.getByText('Install Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders public and private routes once installed', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { installed: true }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();

    renderWithProviders(<App />, {
      initialEntries: ['/messages'],
      store: memberStore()
    });

    expect(screen.getByTestId('private-layout')).toBeInTheDocument();
    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });

  it('redirects legacy /private URLs to the unprefixed path', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { installed: true }
    });

    renderWithProviders(<App />, {
      initialEntries: ['/private/messages'],
      store: memberStore()
    });

    expect(screen.getByTestId('private-layout')).toBeInTheDocument();
    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });

  // Home had a layout instance of its own, so crossing into or out of it
  // remounted the layout, and the remount re-created the theme link: a
  // default-theme flash on every home crossing (#161, since #379).
  it('keeps one layout instance across home and other private pages', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { installed: true }
    });
    let navigate: NavigateFunction = () => {};
    const NavigateHandle = () => {
      const nav = useNavigate();
      useEffect(() => {
        navigate = nav;
      }, [nav]);
      return null;
    };

    renderWithProviders(
      <>
        <App />
        <NavigateHandle />
      </>,
      { initialEntries: ['/'], store: memberStore() }
    );
    act(() => navigate('/messages'));
    act(() => navigate('/'));
    act(() => navigate('/top10/releases'));

    expect(screen.getByTestId('private-layout')).toBeInTheDocument();
    expect(mockPrivateLayoutMounts).toBe(1);
  });
});
