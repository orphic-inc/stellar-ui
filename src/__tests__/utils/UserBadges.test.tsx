import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders, createTestStore } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import UserBadges, { AuthorBadges } from '../../components/layout/UserBadges';
import { formatDate } from '../../utils';

const PATRON = { name: 'Patron', badge: '★', color: '#ffcc00' };

const signedInAs = (id: number, warnedUntil: string | null) => {
  const store = createTestStore();
  store.dispatch(setCredentials({ id, warnedUntil } as never));
  return store;
};

describe('UserBadges', () => {
  it('renders nothing when no badges apply', () => {
    const { container } = renderWithProviders(
      <UserBadges disabled={false} warned={null} donorRank={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows Disabled badge when disabled is true', () => {
    renderWithProviders(<UserBadges disabled={true} />);
    expect(screen.getByLabelText('Disabled')).toBeInTheDocument();
  });

  it('shows Warned badge when warned is truthy', () => {
    renderWithProviders(<UserBadges warned={true} />);
    expect(screen.getByLabelText('Warned')).toBeInTheDocument();
  });

  it('shows Donor badge when a tier is active', () => {
    renderWithProviders(<UserBadges donorRank={PATRON} />);
    expect(screen.getByLabelText('Donor: Patron')).toBeInTheDocument();
  });

  it('shows multiple badges simultaneously', () => {
    renderWithProviders(
      <UserBadges disabled={true} warned={true} donorRank={PATRON} />
    );
    expect(screen.getByLabelText('Disabled')).toBeInTheDocument();
    expect(screen.getByLabelText('Warned')).toBeInTheDocument();
    expect(screen.getByLabelText('Donor: Patron')).toBeInTheDocument();
  });
});

// #103 — the donor sign is the member's tier, and follows its expiry.
describe('UserBadges donor tier', () => {
  it('shows the tier badge in the tier colour, named in its tooltip', () => {
    renderWithProviders(<UserBadges donorRank={PATRON} />);
    const sign = screen.getByLabelText('Donor: Patron');
    expect(sign).toHaveTextContent('★');
    expect(sign).toHaveAttribute('title', 'Patron');
    expect(sign).toHaveStyle({ color: '#ffcc00' });
  });

  it('shows nothing for an expired grant, even while isDonor lags', () => {
    // null is the API saying "no active tier". isDonor can stay true until
    // the hourly sweep, which is why AuthorBadges never passes it.
    const { container } = renderWithProviders(
      <AuthorBadges
        author={{
          id: 9,
          username: 'lapsed',
          avatar: null,
          isDonor: true,
          donorRank: null,
          warned: null
        }}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('UserBadges warning sign', () => {
  it('links to the rules, titled Warned', () => {
    renderWithProviders(
      <UserBadges userId={9} warned="2026-09-01T00:00:00.000Z" />,
      { store: signedInAs(7, '2026-12-01T00:00:00.000Z') }
    );
    const sign = screen.getByLabelText('Warned');
    expect(sign.closest('a')).toHaveAttribute('href', '/rules');
    // Someone else's name: their expiry is never shown (nor sent, api#719).
    expect(sign).toHaveAttribute('title', 'Warned');
  });

  it('shows the member when their own warning ends', () => {
    const until = '2026-12-01T00:00:00.000Z';
    renderWithProviders(
      <UserBadges userId={7} warned="2026-09-01T00:00:00.000Z" />,
      { store: signedInAs(7, until) }
    );
    expect(screen.getByLabelText('Warned')).toHaveAttribute(
      'title',
      `Warned — expires ${formatDate(until)}`
    );
  });

  it('says a permanent warning on their own name has no end', () => {
    renderWithProviders(
      <UserBadges userId={7} warned="2026-09-01T00:00:00.000Z" />,
      { store: signedInAs(7, null) }
    );
    expect(screen.getByLabelText('Warned')).toHaveAttribute(
      'title',
      'Warned — no expiry'
    );
  });
});

describe('AuthorBadges', () => {
  it('reads both signs off an AuthorRef', () => {
    renderWithProviders(
      <AuthorBadges
        author={{
          id: 9,
          username: 'someone',
          avatar: null,
          isDonor: true,
          donorRank: PATRON,
          warned: '2026-09-01T00:00:00.000Z'
        }}
      />
    );
    expect(screen.getByLabelText('Donor: Patron')).toBeInTheDocument();
    expect(screen.getByLabelText('Warned')).toBeInTheDocument();
  });

  it('renders nothing without an author', () => {
    const { container } = renderWithProviders(<AuthorBadges author={null} />);
    expect(container.firstChild).toBeNull();
  });
});
