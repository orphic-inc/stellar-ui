import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CommunityManager from '../../components/admin/CommunityManager';

// Community Manager's release-announcement control (#477, stellar-api#328,
// ADR-0030). Kept apart from CommunityManager.test.tsx, which is already over
// Codacy's file size limit.

const mockGetCommunitiesQuery = jest.fn();
const mockCreateCommunity = jest.fn();
const mockUpdateCommunity = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetManagedCommunitiesQuery: (...args: unknown[]) =>
    mockGetCommunitiesQuery(...args),
  useCreateCommunityMutation: () => [mockCreateCommunity, { isLoading: false }],
  useUpdateCommunityMutation: () => [mockUpdateCommunity, { isLoading: false }],
  useGetCommunityByIdQuery: () => ({ data: undefined })
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

const community = (announceVisibility?: 'PUBLIC' | 'PRIVATE') => ({
  id: 4,
  name: 'Jazz',
  type: 'Music' as const,
  description: 'Desc',
  registrationStatus: 'open' as const,
  allowDuplicateFormats: true,
  curators: [],
  ...(announceVisibility && { announceVisibility }),
  _count: { releases: 2 }
});

const openEditRow = async (announceVisibility?: 'PUBLIC' | 'PRIVATE') => {
  const user = userEvent.setup();
  mockGetCommunitiesQuery.mockReturnValue({
    data: { data: [community(announceVisibility)] },
    isLoading: false,
    error: undefined
  });
  const { container } = renderWithProviders(<CommunityManager />);
  await user.click(screen.getByRole('button', { name: /edit/i }));
  const row = container.querySelector('tr[data-st-open]') as HTMLElement;
  const select = within(row).getByLabelText(/release announcements/i);
  return { user, row, select };
};

describe('CommunityManager release announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCommunity.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 99 })
    });
    mockUpdateCommunity.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it("shows the community's current setting in the edit row", async () => {
    const { select } = await openEditRow('PRIVATE');
    expect(select).toHaveValue('PRIVATE');
  });

  it('shows public when the community has no setting', async () => {
    const { select } = await openEditRow();
    expect(select).toHaveValue('PUBLIC');
  });

  it('says what the setting does and does not do', async () => {
    const { select } = await openEditRow();
    expect(select).toHaveAccessibleDescription(
      /never hides releases or limits downloads.*verified IRC nick.*not retroactive/i
    );
  });

  it('sends the chosen setting when the edit row saves', async () => {
    const { user, row, select } = await openEditRow('PUBLIC');
    await user.selectOptions(select, 'PRIVATE');
    await user.click(within(row).getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(mockUpdateCommunity).toHaveBeenCalledWith(
        expect.objectContaining({ id: 4, announceVisibility: 'PRIVATE' })
      );
    });
  });

  it("alerts with the api's message when that save fails", async () => {
    mockUpdateCommunity.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Not permitted' } })
    });
    const { user, row, select } = await openEditRow('PUBLIC');
    await user.selectOptions(select, 'PRIVATE');
    await user.click(within(row).getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            alertType: 'danger',
            msg: 'Not permitted'
          })
        })
      );
    });
    expect(select).toHaveValue('PRIVATE');
  });

  it('creates a community as public unless told otherwise', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.type(screen.getByLabelText(/^name/i), 'Folk');
    await user.click(screen.getByRole('button', { name: /create community/i }));
    await waitFor(() => {
      expect(mockCreateCommunity).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Folk', announceVisibility: 'PUBLIC' })
      );
    });
  });

  it('creates a community with private announcements when chosen', async () => {
    const user = userEvent.setup();
    mockGetCommunitiesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityManager />);
    await user.type(screen.getByLabelText(/^name/i), 'Folk');
    await user.selectOptions(
      screen.getByLabelText(/release announcements/i),
      'PRIVATE'
    );
    await user.click(screen.getByRole('button', { name: /create community/i }));
    await waitFor(() => {
      expect(mockCreateCommunity).toHaveBeenCalledWith(
        expect.objectContaining({ announceVisibility: 'PRIVATE' })
      );
    });
  });
});
