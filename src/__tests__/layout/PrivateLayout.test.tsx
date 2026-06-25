import React from 'react';
import { screen } from '@testing-library/react';
import { createTestStore, renderWithProviders } from '../testUtils';
import PrivateLayout from '../../components/pages/private/layout/PrivateLayout';
import { setCredentials } from '../../store/slices/authSlice';

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

// These shell children each fire their own RTK Query on mount; stub them so the
// layout test doesn't issue real fetches (no jsdom Request → no unhandled-
// rejection / act() noise). Neither is asserted by these tests.
jest.mock('../../components/layout/StylesheetInjector', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../components/layout/GlobalNoticeBanner', () => ({
  __esModule: true,
  default: () => null
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

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'kai',
        email: 'kai@example.com',
        avatar: null,
        canDownload: true,
        contributed: '0',
        consumed: '0',
        ratio: 1,
        userRank: {
          name: 'User',
          level: 100,
          color: 'gray',
          permissions: {}
        }
      })
    );

    renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>,
      { store }
    );

    expect(screen.getByTestId('private-header')).toHaveTextContent('kai');
    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.getByTestId('private-footer')).toBeInTheDocument();
    expect(screen.getByTestId('notification-corner')).toBeInTheDocument();
  });

  it('redirects after logout even when getMe still has cached user data', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: false,
      isUninitialized: false,
      isError: false,
      data: { username: 'stale-user' }
    });

    renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>,
      { initialEntries: ['/private/forums'] }
    );

    expect(window.location.pathname).not.toBe('/private/forums');
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });
});
