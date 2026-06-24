import { render } from '@testing-library/react';

const mockUseGetMyProfileQuery = jest.fn();
const mockUseGetStylesheetsQuery = jest.fn();

jest.mock('../store/services/profileApi', () => ({
  useGetMyProfileQuery: () => mockUseGetMyProfileQuery()
}));
jest.mock('../store/services/siteApi', () => ({
  useGetStylesheetsQuery: () => mockUseGetStylesheetsQuery()
}));

import StylesheetInjector from '../components/layout/StylesheetInjector';

const LINK_ID = 'stellar-theme';
const linkEl = () => document.getElementById(LINK_ID) as HTMLLinkElement | null;

beforeEach(() => {
  mockUseGetMyProfileQuery.mockReturnValue({ data: undefined });
  mockUseGetStylesheetsQuery.mockReturnValue({ data: undefined });
  linkEl()?.remove();
});

describe('StylesheetInjector', () => {
  it('injects a <link> for an external stylesheet URL', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: {
        userSettings: { externalStylesheet: 'https://cdn.example.com/me.css' }
      }
    });

    render(<StylesheetInjector />);

    const el = linkEl();
    expect(el?.tagName).toBe('LINK');
    expect(el?.rel).toBe('stylesheet');
    expect(el?.href).toBe('https://cdn.example.com/me.css');
  });

  it('injects the built-in cssUrl for a selected siteAppearance', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { siteAppearance: 'kuro' } }
    });
    mockUseGetStylesheetsQuery.mockReturnValue({
      data: [{ name: 'kuro', cssUrl: '/stylesheets/kuro.css' }]
    });

    render(<StylesheetInjector />);
    expect(linkEl()?.getAttribute('href')).toBe('/stylesheets/kuro.css');
  });

  it('injects nothing when no theme is selected', () => {
    render(<StylesheetInjector />);
    expect(linkEl()).toBeNull();
  });

  it('refuses a non-http(s) external URL scheme', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { externalStylesheet: 'javascript:alert(1)' } }
    });
    render(<StylesheetInjector />);
    expect(linkEl()).toBeNull();
  });

  it('refuses a data: external URL scheme', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { externalStylesheet: 'data:text/css,*{}' } }
    });
    render(<StylesheetInjector />);
    expect(linkEl()).toBeNull();
  });
});
