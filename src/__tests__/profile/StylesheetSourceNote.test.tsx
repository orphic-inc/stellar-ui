import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import StylesheetSourceNote, {
  AdoptedSheetHint
} from '../../components/profile/settings/StylesheetSourceNote';

describe('StylesheetSourceNote (#450)', () => {
  it('keeps the one-source rule and links to My stylesheets', () => {
    renderWithProviders(<StylesheetSourceNote />);
    expect(screen.getByText(/one source at a time/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /my stylesheets/i })
    ).toHaveAttribute('href', '/stylesheets');
  });

  describe('AdoptedSheetHint (#451)', () => {
    it('says where to adopt one when none is adopted', () => {
      renderWithProviders(<AdoptedSheetHint id={null} />);
      expect(
        screen.getByText(
          "None adopted yet — open a stylesheet's page to adopt it."
        )
      ).toBeInTheDocument();
      expect(screen.queryByRole('link')).toBeNull();
    });

    it("links to the adopted sheet's page", () => {
      renderWithProviders(<AdoptedSheetHint id={12} />);
      expect(
        screen.getByText(/using adopted stylesheet #12/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /its page/i })).toHaveAttribute(
        'href',
        '/stylesheets/12'
      );
    });
  });
});
