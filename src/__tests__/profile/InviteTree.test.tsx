import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import InviteTree from '../../components/profile/invite/InviteTree';
import type { MemberInviteTreeNode, InviteTreeSummary } from '../../types';

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

const tree: MemberInviteTreeNode[] = [
  {
    userId: 7,
    username: 'charlie',
    rankName: 'Member',
    isDonor: true,
    disabled: false,
    depth: 0,
    stats: { contributed: '1.00 GB', consumed: '0.50 GB', ratio: '2.00' },
    children: [
      {
        userId: 8,
        username: 'dave',
        rankName: 'User',
        isDonor: false,
        disabled: true,
        depth: 1,
        stats: null,
        children: []
      }
    ]
  }
];

const summary: InviteTreeSummary = {
  entries: 2,
  branches: 1,
  depth: 2,
  disabledCount: 1,
  donorCount: 1,
  hiddenCount: 3,
  byRank: [
    { rankName: 'Member', count: 1 },
    { rankName: 'User', count: 1 }
  ],
  total: { contributed: '1.00 GB', consumed: '0.50 GB', ratio: '2.00' },
  topLevel: { contributed: '1.00 GB', consumed: '0.50 GB', ratio: '2.00' }
};

let mockParamId: string | undefined;
let mockData:
  | { tree: MemberInviteTreeNode[]; summary: InviteTreeSummary }
  | undefined = { tree, summary };
let mockIsLoading = false;
const mockUseGetMemberInviteTreeQuery = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => ({ id: 42 })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: mockParamId })
}));

jest.mock('../../store/services/userApi', () => ({
  useGetMemberInviteTreeQuery: (...args: unknown[]) =>
    mockUseGetMemberInviteTreeQuery(...args)
}));

describe('InviteTree', () => {
  beforeEach(() => {
    mockParamId = undefined;
    mockData = { tree, summary };
    mockIsLoading = false;
    mockUseGetMemberInviteTreeQuery.mockImplementation(() => ({
      data: mockData,
      isLoading: mockIsLoading
    }));
  });

  it('shows spinner while loading', () => {
    mockIsLoading = true;
    mockData = undefined;
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('queries the current user id when no :id param is present', () => {
    renderWithProviders(<InviteTree />);
    expect(mockUseGetMemberInviteTreeQuery).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ skip: false })
    );
  });

  it('queries the :id param for the per-member view', () => {
    mockParamId = '99';
    renderWithProviders(<InviteTree />);
    expect(mockUseGetMemberInviteTreeQuery).toHaveBeenCalledWith(
      99,
      expect.objectContaining({ skip: false })
    );
  });

  it('renders nested invitee usernames', () => {
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('charlie')).toBeInTheDocument();
    expect(screen.getByText('dave')).toBeInTheDocument();
  });

  it('renders a dash for hidden (null) stats', () => {
    renderWithProviders(<InviteTree />);
    // dave has null stats → three dashes (uploaded/downloaded/ratio)
    expect(screen.getAllByText('—').length).toBe(3);
  });

  it('renders the summary rollup', () => {
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Donors')).toBeInTheDocument();
    expect(screen.getByText('By rank')).toBeInTheDocument();
    expect(screen.getByText(/3 members hidden/)).toBeInTheDocument();
  });

  it('shows empty state when there are no invitees', () => {
    mockData = { tree: [], summary: { ...summary, entries: 0 } };
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('No invitees.')).toBeInTheDocument();
  });
});
