import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CommunityManager from '../../components/admin/CommunityManager';

const mockGetCommunitiesQuery = jest.fn();
const mockCreateCommunity = jest.fn();
const mockUpdateCommunity = jest.fn();
const mockDispatch = jest.fn();

let mockIsCreating = false;

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: (...args: unknown[]) =>
    mockGetCommunitiesQuery(...args),
  useCreateCommunityMutation: () => [mockCreateCommunity, { isLoading: mockIsCreating }],
  useUpdateCommunityMutation: () => [mockUpdateCommunity, { isLoading: false }]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
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
    mockIsCreating = false;
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
    await user.click(screen.getByRole('button', { name: /create community/i }));
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
    await user.click(screen.getByRole('button', { name: /create community/i }));
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
    expect(screen.getByDisplayValue('Community 3')).toBeInTheDocument();
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
    await user.selectOptions(
      screen.getByLabelText(/registration/i),
      'Invite only'
    );
    expect(screen.getByLabelText(/owner user id/i)).toBeInTheDocument();
  });

  it('allows changing type and description in create form', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.selectOptions(screen.getByLabelText(/^type/i), 'Applications');
    await user.type(
      screen.getByLabelText(/description/i),
      'A great collection'
    );
    expect((screen.getByLabelText(/^type/i) as HTMLSelectElement).value).toBe(
      'Applications'
    );
    expect(
      (screen.getByLabelText(/description/i) as HTMLInputElement).value
    ).toBe('A great collection');
  });

  it('toggles allow-duplicate-formats checkbox in create form', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    // The create form's "allow duplicate formats" checkbox is the first one
    // Create form starts with allowDuplicateFormats = true by default
    const checkboxes = screen.getAllByLabelText(/allow duplicate formats/i);
    const checkbox = checkboxes[0] as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('adds a staff member in the edit row', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [makeCommunity(5)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));

    const staffInput = screen.getByPlaceholderText('User ID');
    await user.type(staffInput, '42');
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Staff member should appear as a tag
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('removes a staff member when × is clicked', async () => {
    const user = userEvent.setup();
    const community = {
      ...makeCommunity(6),
      staff: [{ id: 10, username: 'mod-alice' }]
    };
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [community] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByText('mod-alice')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '×' }));
    expect(screen.queryByText('mod-alice')).toBeNull();
  });

  it('changes name, description, and registration in the edit row', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [makeCommunity(3)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));

    const nameInput = screen.getByDisplayValue('Community 3');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');

    const descInput = screen.getByDisplayValue('Desc 3');
    await user.clear(descInput);
    await user.type(descInput, 'New desc');

    await user.selectOptions(
      screen.getAllByDisplayValue('Open')[0],
      'Invite only'
    );

    expect((nameInput as HTMLInputElement).value).toBe('Renamed');
    expect((descInput as HTMLInputElement).value).toBe('New desc');
  });

  it('saves edit row with staff members and fires map callback', async () => {
    const user = userEvent.setup();
    const community = { ...makeCommunity(8), staff: [{ id: 20, username: 'staffer' }] };
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [community] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(mockUpdateCommunity).toHaveBeenCalledWith(
        expect.objectContaining({ staffIds: [20] })
      );
    });
  });

  it('does not add a staff member when user ID is zero or empty', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [makeCommunity(9)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const staffInput = screen.getByPlaceholderText('User ID');
    await user.type(staffInput, '0');
    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.queryByText('#0')).toBeNull();
  });

  it('does not add a duplicate staff member', async () => {
    const user = userEvent.setup();
    const community = { ...makeCommunity(10), staff: [{ id: 30, username: 'existing' }] };
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [community] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const staffInput = screen.getByPlaceholderText('User ID');
    await user.type(staffInput, '30');
    await user.click(screen.getByRole('button', { name: /add/i }));
    // 'existing' should appear exactly once (no duplicate)
    expect(screen.getAllByText('existing').length).toBe(1);
  });

  it('allows typing in the owner ID field when registration is invite-only', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.selectOptions(screen.getByLabelText(/registration/i), 'Invite only');
    const ownerInput = screen.getByLabelText(/owner user id/i);
    await user.type(ownerInput, '5');
    expect((ownerInput as HTMLInputElement).value).toBe('5');
  });

  it('shows Creating… when isCreating is true', () => {
    mockIsCreating = true;
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    expect(screen.getByRole('button', { name: /creating…/i })).toBeInTheDocument();
  });

  it('renders community with null type and description as dashes', () => {
    mockGetCommunitiesQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 11,
            name: 'Sparse Community',
            type: undefined,
            description: undefined,
            registrationStatus: 'open',
            allowDuplicateFormats: false,
            staffIds: [],
            _count: undefined
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('opens edit for community with null description and uses toRegistrationStatus fallback', async () => {
    const user = userEvent.setup();
    const community = {
      id: 12,
      name: 'No Desc',
      type: 'Music' as const,
      description: undefined,
      registrationStatus: undefined,
      allowDuplicateFormats: false,
      staffIds: [],
      _count: { releases: 0 }
    };
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [community] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByDisplayValue('No Desc')).toBeInTheDocument();
  });

  it('creates community with owner ID when invite registration is selected', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.type(screen.getByLabelText(/^name/i), 'Invite Community');
    await user.selectOptions(screen.getByLabelText(/registration \*/i), 'Invite only');
    await user.type(screen.getByLabelText(/owner user id/i), '7');
    await user.click(screen.getByRole('button', { name: /create community/i }));
    await waitFor(() => {
      expect(mockCreateCommunity).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 7 })
      );
    });
  });

  it('dispatches fallback danger alert when create fails with no API message', async () => {
    mockCreateCommunity.mockReturnValue({ unwrap: () => Promise.reject({}) });
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.type(screen.getByLabelText(/^name/i), 'Test');
    await user.click(screen.getByRole('button', { name: /create community/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ msg: 'Failed to create community.' })
        })
      );
    });
  });

  it('toggles allowDuplicateFormats checkbox in edit row', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [makeCommunity(7)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.click(screen.getByRole('button', { name: /edit/i }));

    // After opening edit row there are two "allow duplicate formats" checkboxes:
    // index 0 is the edit row's, index 1 is the create form's
    const checkboxes = screen.getAllByLabelText(/allow duplicate formats/i);
    const editCheckbox = checkboxes[0] as HTMLInputElement;
    const initial = editCheckbox.checked;
    await user.click(editCheckbox);
    expect(editCheckbox.checked).toBe(!initial);
  });
});
