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
const STORAGE_KEY = 'stellar-theme-href';
const linkEl = () => document.getElementById(LINK_ID) as HTMLLinkElement | null;

beforeEach(() => {
  mockUseGetMyProfileQuery.mockReturnValue({ data: undefined });
  mockUseGetStylesheetsQuery.mockReturnValue({ data: undefined });
  linkEl()?.remove();
  window.localStorage.clear();
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

  it('mutates the existing <link> in place on a live theme switch, whether it was created or adopted', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { siteAppearance: 'kuro' } }
    });
    mockUseGetStylesheetsQuery.mockReturnValue({
      data: [
        { name: 'kuro', cssUrl: '/stylesheets/kuro.css' },
        { name: 'proton', cssUrl: '/stylesheets/proton.css' }
      ]
    });

    const { rerender } = render(<StylesheetInjector />);
    const firstLink = linkEl();
    expect(firstLink?.getAttribute('href')).toBe('/stylesheets/kuro.css');

    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { siteAppearance: 'proton' } }
    });
    rerender(<StylesheetInjector />);

    expect(document.querySelectorAll(`#${LINK_ID}`)).toHaveLength(1);
    expect(linkEl()).toBe(firstLink);
    expect(linkEl()?.getAttribute('href')).toBe('/stylesheets/proton.css');
  });

  it('injects the API /css delivery route for an adopted registry stylesheet', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { activeAuthorStylesheetId: 42 } }
    });

    render(<StylesheetInjector />);
    expect(linkEl()?.getAttribute('href')).toBe(
      '/api/stylesheet/author-stylesheet/42/css'
    );
  });

  it('prefers a Personal URL over a Registry pointer (single winner, no stacking)', () => {
    // The API enforces XOR, but if both ever arrive, external wins and only one
    // <link> exists — never a stack.
    mockUseGetMyProfileQuery.mockReturnValue({
      data: {
        userSettings: {
          externalStylesheet: 'https://cdn.example.com/me.css',
          activeAuthorStylesheetId: 42
        }
      }
    });

    render(<StylesheetInjector />);
    expect(document.querySelectorAll(`#${LINK_ID}`)).toHaveLength(1);
    expect(linkEl()?.href).toBe('https://cdn.example.com/me.css');
  });

  it('injects nothing when no theme is selected', () => {
    mockUseGetMyProfileQuery.mockReturnValue({ data: { userSettings: {} } });
    mockUseGetStylesheetsQuery.mockReturnValue({ data: [] });

    render(<StylesheetInjector />);
    expect(linkEl()).toBeNull();
  });

  it('refuses a non-https external URL scheme', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { externalStylesheet: 'javascript:alert(1)' } }
    });
    render(<StylesheetInjector />);
    expect(linkEl()).toBeNull();
  });

  it('refuses a plain http external URL (https only, ADR-0024 §3)', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: {
        userSettings: { externalStylesheet: 'http://cdn.example.com/x.css' }
      }
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

  it('writes the resolved href to localStorage for the cold-load pre-apply script', () => {
    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { siteAppearance: 'kuro' } }
    });
    mockUseGetStylesheetsQuery.mockReturnValue({
      data: [{ name: 'kuro', cssUrl: '/stylesheets/kuro.css' }]
    });

    render(<StylesheetInjector />);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      '/stylesheets/kuro.css'
    );
  });

  it('clears the stored href once resolved to no theme, so a stale value cannot win a future cold load', () => {
    window.localStorage.setItem(STORAGE_KEY, '/stylesheets/kuro.css');
    mockUseGetMyProfileQuery.mockReturnValue({ data: { userSettings: {} } });
    mockUseGetStylesheetsQuery.mockReturnValue({ data: [] });

    render(<StylesheetInjector />);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('adopts a pre-applied <link> in place instead of creating a duplicate', () => {
    // Simulates src/preapply-theme.js already having run before mount.
    const preapplied = document.createElement('link');
    preapplied.id = LINK_ID;
    preapplied.rel = 'stylesheet';
    preapplied.href = '/stylesheets/stale.css';
    document.head.appendChild(preapplied);

    mockUseGetMyProfileQuery.mockReturnValue({
      data: { userSettings: { siteAppearance: 'kuro' } }
    });
    mockUseGetStylesheetsQuery.mockReturnValue({
      data: [{ name: 'kuro', cssUrl: '/stylesheets/kuro.css' }]
    });

    render(<StylesheetInjector />);
    expect(document.querySelectorAll(`#${LINK_ID}`)).toHaveLength(1);
    expect(linkEl()?.getAttribute('href')).toBe('/stylesheets/kuro.css');
  });

  it('does not touch a pre-applied <link> while the resolving queries are still loading', () => {
    const preapplied = document.createElement('link');
    preapplied.id = LINK_ID;
    preapplied.rel = 'stylesheet';
    preapplied.href = '/stylesheets/kuro.css';
    document.head.appendChild(preapplied);

    // Default beforeEach mocks: both queries report `data: undefined`, i.e. still loading.
    render(<StylesheetInjector />);

    expect(document.querySelectorAll(`#${LINK_ID}`)).toHaveLength(1);
    expect(linkEl()?.getAttribute('href')).toBe('/stylesheets/kuro.css');
  });
});
