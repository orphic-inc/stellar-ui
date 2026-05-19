import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import InviteTree from '../../components/profile/invite/InviteTree';

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
}));

const mockInviteTree = [
  {
    id: 1,
    username: 'charlie',
    email: 'charlie@example.com',
    joinedAt: '2024-01-01',
    lastSeen: '2024-06-01',
    contributed: '1.00 GB',
    consumed: '0.50 GB',
    ratio: '2.00',
    children: []
  }
];

let mockUser: { id: number } | null = { id: 42 };
let mockProfile: { inviteTree: typeof mockInviteTree } | undefined = {
  inviteTree: mockInviteTree
};
let mockIsLoading = false;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockUser
}));

jest.mock('../../store/services/profileApi', () => ({
  useGetMyProfileQuery: () => ({ data: mockProfile, isLoading: mockIsLoading })
}));

describe('InviteTree', () => {
  beforeEach(() => {
    mockUser = { id: 42 };
    mockProfile = { inviteTree: mockInviteTree };
    mockIsLoading = false;
  });

  it('shows spinner when loading', () => {
    mockIsLoading = true;
    mockProfile = undefined;
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when no invitees', () => {
    mockProfile = { inviteTree: [] };
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('No invitees.')).toBeInTheDocument();
  });

  it('renders invitee username and email', () => {
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('charlie')).toBeInTheDocument();
    expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    renderWithProviders(<InviteTree />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Ratio')).toBeInTheDocument();
  });

  it('shows dash when joinedAt or lastSeen is null', () => {
    mockProfile = {
      inviteTree: [
        {
          id: 2,
          username: 'dave',
          email: 'dave@example.com',
          joinedAt: null as unknown as string,
          lastSeen: null as unknown as string,
          contributed: '0.00 GB',
          consumed: '0.00 GB',
          ratio: '0.00',
          children: []
        }
      ]
    };
    renderWithProviders(<InviteTree />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });
});
