import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../components/App';

const mockUseGetInstallStatusQuery = jest.fn();

jest.mock('../store/services/installApi', () => ({
  useGetInstallStatusQuery: () => mockUseGetInstallStatusQuery()
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

const renderApp = (initialEntries: string[] = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );

describe('App', () => {
  beforeEach(() => {
    mockUseGetInstallStatusQuery.mockReset();
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

    render(
      <MemoryRouter initialEntries={['/private/messages']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('private-layout')).toBeInTheDocument();
    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });
});
