import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ThemesOffBanner from '../../components/layout/ThemesOffBanner';
import { __resetThemeHatch, setThemesOff } from '../../utils/themeHatch';

describe('ThemesOffBanner (#449)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    __resetThemeHatch();
  });

  it('shows nothing while themes are on', () => {
    renderWithProviders(<ThemesOffBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says the tab is unthemed while themes are off', () => {
    window.sessionStorage.setItem('stellar-notheme', '1');
    renderWithProviders(<ThemesOffBanner />);
    expect(screen.getByRole('status')).toHaveTextContent(
      /member themes are off in this tab/i
    );
  });

  it('turns themes back on, clearing the flag', async () => {
    const user = userEvent.setup();
    act(() => setThemesOff(true));
    renderWithProviders(<ThemesOffBanner />);
    await user.click(
      screen.getByRole('button', { name: /turn themes back on/i })
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem('stellar-notheme')).toBeNull();
  });

  it('turns themes off for ?notheme=1 arriving by an in-app link', () => {
    renderWithProviders(<ThemesOffBanner />, {
      initialEntries: ['/bookmarks?notheme=1']
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('stellar-notheme')).toBe('1');
  });
});
