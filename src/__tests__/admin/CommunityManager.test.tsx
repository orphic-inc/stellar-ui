import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CommunityManager from '../../components/admin/CommunityManager';

const mockGetCommunitiesQuery = jest.fn();
const mockCreateCommunity = jest.fn();
const mockUpdateCommunity = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: (...args: unknown[]) =>
    mockGetCommunitiesQuery(...args),
  useCreateCommunityMutation: () => [mockCreateCommunity, { isLoading: false }],
  useUpdateCommunityMutation: () => [mockUpdateCommunity, { isLoading: false }]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({
    to,
    children
  }: {
    to: string;
    children: React.ReactNode;
  }) => <a href={to}>{children}</a>
}));

const makeCommunity = (id: number) => ({
  id,
  name: `Community ${id}`,
  type: 'Music' as const,
  description: `Desc ${id}`,
  registrationStatus: 'open' as const,
  allowDuplicateFormats: true,
  staffIds: [],
  _count: { releases: id * 5 }
});

describe('CommunityManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCommunity.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 99 })
    });
    mockUpdateCommunity.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('shows spinner while loading', () => {
    mockGetCommunitiesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockGetCommunitiesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<CommunityManager />);
    expect(screen.getByText(/failed to load communities/i)).toBeInTheDocument();
  });

  it('shows empty state when no communities', () => {
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    expect(screen.getByText(/no communities yet/i)).toBeInTheDocument();
  });

  it('renders community list with name and type', () => {
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [makeCommunity(1), makeCommunity(2)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    expect(
      screen.getByRole('link', { name: 'Community 1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Community 2' })
    ).toBeInTheDocument();
  });

  it('creates a community and dispatches success alert', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.type(screen.getByLabelText(/^name/i), 'Jazz Hub');
    await user.click(
      screen.getByRole('button', { name: /create community/i })
    );
    await waitFor(() => {
      expect(mockCreateCommunity).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Jazz Hub' })
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'success' })
        })
      );
    });
  });

  it('dispatches danger alert on create failure', async () => {
    mockCreateCommunity.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Name already taken.' } })
    });
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.type(screen.getByLabelText(/^name/i), 'Dupe');
    await user.click(
      screen.getByRole('button', { name: /create community/i })
    );
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });

  it('opens edit row on Edit click and saves with updateCommunity', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [makeCommunity(3)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(
      screen.getByDisplayValue('Community 3')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(mockUpdateCommunity).toHaveBeenCalled();
    });
  });

  it('shows owner ID field when status is not open', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    expect(screen.queryByLabelText(/owner user id/i)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/registration/i), 'Invite only');
    expect(screen.getByLabelText(/owner user id/i)).toBeInTheDocument();
  });
});
