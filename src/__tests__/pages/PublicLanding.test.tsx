import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PublicLanding from '../../components/pages/public/PublicLanding';

/**
 * PublicLanding is now the hero copy and nothing else. The Sign In / Register
 * links it used to render were duplicates of the ones in `PublicLayout`'s nav,
 * and were removed from here rather than from the layout.
 *
 * The auth-link behaviour is therefore NOT untested — it lives in
 * `__tests__/layout/PublicLayout.test.tsx`, against the component that actually
 * owns those links, including the `registrationStatus` gate in both directions.
 * This file deliberately does not restate it: a gate assertion here would only
 * re-prove that a component with no links has no links, which is how the old
 * "hides Register" case kept passing after the links were gone.
 */
describe('PublicLanding', () => {
  it('renders the hero tagline', () => {
    renderWithProviders(<PublicLanding />);
    expect(screen.getByText(/we didn't start the fire/i)).toBeInTheDocument();
  });

  it('renders no auth links of its own — those belong to PublicLayout', () => {
    // Guards the de-duplication itself: re-adding a Sign In / Register link
    // here would restore the double-rendered CTA this change removed.
    renderWithProviders(<PublicLanding />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
