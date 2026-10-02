import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import StylesheetSourceNote from '../../components/profile/settings/StylesheetSourceNote';

describe('StylesheetSourceNote (#450)', () => {
  it('keeps the one-source rule and links to My stylesheets', () => {
    renderWithProviders(<StylesheetSourceNote />);
    expect(screen.getByText(/one source at a time/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /my stylesheets/i })
    ).toHaveAttribute('href', '/stylesheets');
  });
});
