import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PrivateLayout from '../../components/pages/private/layout/PrivateLayout';

const mockUseGetMeQuery = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: () => mockUseGetMeQuery()
}));

jest.mock('../../components/pages/private/layout/PrivateHeader', () => ({
  __esModule: true,
  default: ({ user }: { user: { username: string } }) => (
    <div data-testid="private-header">{user.username}</div>
  )
}));

jest.mock('../../components/pages/private/layout/PrivateFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="private-footer">Footer</div>
}));

jest.mock('../../components/layout/NotificationCorner', () => ({
  __esModule: true,
  default: () => <div data-testid="notification-corner">Notifications</div>
}));

describe('PrivateLayout', () => {
  beforeEach(() => {
    mockUseGetMeQuery.mockReset();
  });

  it('shows a spinner while auth state is unresolved', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: true,
      isUninitialized: false,
      isError: false,
      data: undefined
    });

    const { container } = renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>
    );

    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: false,
      isUninitialized: false,
      isError: true,
      data: undefined
    });

    renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>,
      { initialEntries: ['/private/messages'] }
    );

    expect(window.location.pathname).not.toBe('/private/messages');
  });

  it('renders the authenticated layout shell', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: false,
      isUninitialized: false,
      isError: false,
      data: { username: 'kai' }
    });

    renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>
    );

    expect(screen.getByTestId('private-header')).toHaveTextContent('kai');
    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.getByTestId('private-footer')).toBeInTheDocument();
    expect(screen.getByTestId('notification-corner')).toBeInTheDocument();
  });
});
