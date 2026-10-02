import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RegistrationLogPage from '../../components/staff/RegistrationLogPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetRegistrationLogQuery: () => mockQuery()
}));

const makeUser = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  disabled: false,
  userRank: { name: 'Member' },
  dateRegistered: '2026-01-02T00:00:00.000Z',
  lastIp: '10.0.0.1',
  lastIpAccounts: 1,
  inviter: null,
  sameIp: false,
  ...over
});

const inviter = (over: Record<string, unknown> = {}) => ({
  ...makeUser(50, { username: 'carol', email: 'carol@example.com' }),
  lastIp: '10.0.0.9',
  lastIpAccounts: 3,
  ...over
});

const showRows = (rows: unknown[]) =>
  mockQuery.mockReturnValue({
    data: { data: rows, meta: { totalPages: 1 } },
    isLoading: false
  });

const rowOf = (text: string) => screen.getByText(text).closest('tr')!;

describe('RegistrationLogPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a spinner while loading', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<RegistrationLogPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<RegistrationLogPage />);
    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('renders users on the grid table with a Disabled badge', () => {
    mockQuery.mockReturnValue({
      data: {
        data: [makeUser(1), makeUser(2, { disabled: true })],
        meta: { totalPages: 1 }
      },
      isLoading: false
    });
    renderWithProviders(<RegistrationLogPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    const badge = screen.getByText('Disabled');
    expect(badge).toHaveAttribute('data-st', 'chip');
    expect(badge).toHaveAttribute('data-st-danger');
  });

  it('shows the inviter beneath the account in the same row (#412)', () => {
    showRows([makeUser(1, { inviter: inviter() })]);
    renderWithProviders(<RegistrationLogPage />);
    const row = rowOf('user1');
    expect(within(row).getByRole('link', { name: 'carol' })).toHaveAttribute(
      'href',
      '/user/50'
    );
    expect(within(row).getByText('carol@example.com')).toBeInTheDocument();
    expect(within(row).getByText('10.0.0.9')).toBeInTheDocument();
  });

  it('shows one line when nobody invited the account', () => {
    showRows([makeUser(1)]);
    renderWithProviders(<RegistrationLogPage />);
    expect(within(rowOf('user1')).getAllByRole('link')).toHaveLength(1);
  });

  it('shows how many accounts hold each IP now', () => {
    showRows([makeUser(1, { lastIpAccounts: 2, inviter: inviter() })]);
    renderWithProviders(<RegistrationLogPage />);
    const row = rowOf('user1');
    expect(within(row).getByText('(2)')).toBeInTheDocument();
    expect(within(row).getByText('(3)')).toBeInTheDocument();
  });

  it('labels the IP column as the current IP', () => {
    showRows([makeUser(1)]);
    renderWithProviders(<RegistrationLogPage />);
    expect(
      screen.getByRole('columnheader', { name: 'Current IP' })
    ).toBeInTheDocument();
  });

  it.each([
    [true, true],
    [false, false]
  ])('highlights the row when sameIp is %s', (sameIp, highlighted) => {
    showRows([
      makeUser(1, {
        sameIp,
        inviter: inviter({ lastIp: '10.0.0.1' })
      })
    ]);
    renderWithProviders(<RegistrationLogPage />);
    const row = rowOf('user1');
    expect(row.hasAttribute('data-st-open')).toBe(highlighted);
    expect(!!within(row).queryByText('Same IP')).toBe(highlighted);
  });
});
