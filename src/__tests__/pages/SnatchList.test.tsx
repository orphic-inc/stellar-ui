import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import SnatchList from '../../components/pages/private/snatch/SnatchList';

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const mockItems = [
  {
    id: 1,
    release: { id: 10, title: 'Kind of Blue', communityId: 3 },
    artist: { name: 'Miles Davis' },
    downloadedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: 2,
    release: { id: 20, title: 'Orphan Release', communityId: null },
    artist: null,
    downloadedAt: '2024-02-10T08:00:00Z'
  }
];

let mockData: typeof mockItems | undefined = mockItems;
let mockIsLoading = false;
let mockError: unknown = undefined;

jest.mock('../../store/services/userApi', () => ({
  useGetSnatchListQuery: () => ({
    data: mockData,
    isLoading: mockIsLoading,
    error: mockError
  })
}));

describe('SnatchList', () => {
  beforeEach(() => {
    mockData = mockItems;
    mockIsLoading = false;
    mockError = undefined;
  });

  it('shows spinner when loading', () => {
    mockIsLoading = true;
    mockData = undefined;
    renderWithProviders(<SnatchList />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockError = { status: 500 };
    mockData = undefined;
    renderWithProviders(<SnatchList />);
    expect(screen.getByText(/failed to load snatch list/i)).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    mockData = [];
    renderWithProviders(<SnatchList />);
    expect(
      screen.getByText(/have not downloaded any releases yet/i)
    ).toBeInTheDocument();
  });

  it('emits the data-st theming hooks', () => {
    const { container } = renderWithProviders(<SnatchList />);
    expect(container.querySelector('table[data-st="grid"]')).toBeTruthy();
    expect(container.querySelector('thead[data-st="colhead"]')).toBeTruthy();
    expect(container.querySelector('tr[data-st="row"]')).toBeTruthy();
  });

  it('renders release titles in list', () => {
    renderWithProviders(<SnatchList />);
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('Orphan Release')).toBeInTheDocument();
  });

  it('renders release with community as a link', () => {
    renderWithProviders(<SnatchList />);
    const link = screen.getByRole('link', { name: 'Kind of Blue' });
    expect(link).toHaveAttribute('href', '/private/communities/3/releases/10');
  });

  it('renders release without community as plain text (no link)', () => {
    renderWithProviders(<SnatchList />);
    expect(
      screen.queryByRole('link', { name: 'Orphan Release' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Orphan Release')).toBeInTheDocument();
  });

  it('shows artist name and dashes for unknown', () => {
    renderWithProviders(<SnatchList />);
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
