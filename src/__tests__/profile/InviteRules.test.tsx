import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import InviteRules from '../../components/profile/invite/InviteRules';

const mockTree = jest.fn();

jest.mock('../../store/services/rulesApi', () => ({
  useGetRulesTreeQuery: () => mockTree()
}));

const sub = (code: string, title: string, description: string) => ({
  id: code,
  code,
  title,
  description
});

/** The seeded tree's shape: Accounts first, Invites second (#331). */
const tree = (overrides: { rules?: unknown[]; variables?: unknown } = {}) => ({
  data: {
    rules: overrides.rules ?? [
      {
        id: 1,
        code: 'golden.accounts',
        title: 'Accounts',
        subRules: [
          sub(
            'single-account',
            'Do not create more than one account',
            'If your account is disabled, contact staff in ${disabled_channel} on ${irc}.'
          ),
          sub(
            'no-trade-accounts',
            'Do not trade accounts',
            'Send a ${staffpm}.'
          )
        ]
      },
      {
        id: 2,
        code: 'golden.invites',
        title: 'Invites',
        subRules: [
          sub(
            'no-bad-invitees',
            'Do not invite bad users',
            'You are responsible for your invitees.'
          ),
          sub(
            'no-trade-invites',
            'Do not trade, sell, publicly give away, or publicly offer invites',
            'Only invite people you know and trust.'
          )
        ]
      }
    ],
    variables: overrides.variables ?? {
      disabled_channel: '#disabled',
      irc: '/irc',
      irc_guide_article: 'https://korin.pink/wiki/irc',
      staffpm: '/inbox/staff'
    }
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  mockTree.mockReturnValue(tree());
});

describe('InviteRules (#331)', () => {
  it('quotes 1.1, 2.1 and 2.2 with their positional numbers', () => {
    renderWithProviders(<InviteRules />);
    expect(screen.getByRole('link', { name: '1.1' })).toHaveAttribute(
      'href',
      '/rules#1.1'
    );
    expect(screen.getByRole('link', { name: '2.1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2.2' })).toBeInTheDocument();
    expect(screen.getByText('Do not invite bad users')).toBeInTheDocument();
    expect(
      screen.getByText(/you are responsible for your invitees/i)
    ).toBeInTheDocument();
  });

  it('quotes nothing it was not asked for', () => {
    renderWithProviders(<InviteRules />);
    expect(screen.queryByText('Do not trade accounts')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '1.2' })).not.toBeInTheDocument();
  });

  it('renders the body through the tree variables', () => {
    renderWithProviders(<InviteRules />);
    expect(screen.getByText(/#disabled/)).toBeInTheDocument();
  });

  it('sends ${irc} to the public guide, not the dead route (api#630)', () => {
    renderWithProviders(<InviteRules />);
    expect(screen.getByRole('link', { name: 'IRC' })).toHaveAttribute(
      'href',
      'https://korin.pink/wiki/irc'
    );
  });

  it('follows the code when the tree is reordered, not the number', () => {
    const rules = tree().data.rules as { code: string }[];
    mockTree.mockReturnValue(tree({ rules: [rules[1], rules[0]] }));
    renderWithProviders(<InviteRules />);
    // Invites is rule 1 now, so its sub-rules are 1.1 and 1.2 and the
    // single-account rule is 2.1 — the same three rules, renumbered.
    expect(screen.getByRole('link', { name: '2.1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1.1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1.2' })).toBeInTheDocument();
    expect(
      screen.getByText('Do not create more than one account')
    ).toBeInTheDocument();
  });

  it('skips a rule the tree does not carry', () => {
    const rules = tree().data.rules as { code: string }[];
    mockTree.mockReturnValue(tree({ rules: [rules[0]] }));
    renderWithProviders(<InviteRules />);
    expect(screen.getByRole('link', { name: '1.1' })).toBeInTheDocument();
    expect(
      screen.queryByText('Do not invite bad users')
    ).not.toBeInTheDocument();
  });

  it('renders nothing at all when the tree has none of them', () => {
    mockTree.mockReturnValue(tree({ rules: [] }));
    const { container } = renderWithProviders(<InviteRules />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while the tree is still loading', () => {
    mockTree.mockReturnValue({ data: undefined });
    const { container } = renderWithProviders(<InviteRules />);
    expect(container).toBeEmptyDOMElement();
  });
});
