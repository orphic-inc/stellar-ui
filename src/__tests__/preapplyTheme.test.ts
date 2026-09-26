import { readFileSync } from 'fs';
import { join } from 'path';

// preapply-theme.js ships verbatim, outside the module graph, so it is run here
// as the browser runs it: the whole file, once, against the current storage.
const SCRIPT = readFileSync(join(__dirname, '../preapply-theme.js'), 'utf8');
const LINK_ID = 'stellar-theme';
const STORAGE_KEY = 'stellar-theme-href';
const HREF = '/api/stylesheet/author-stylesheet/3/css';

const runPreapply = () => new Function(SCRIPT)();
const linkEl = () => document.getElementById(LINK_ID) as HTMLLinkElement | null;

beforeEach(() => {
  linkEl()?.remove();
  window.localStorage.clear();
});

describe('preapply-theme.js', () => {
  it('applies the stored theme before React mounts', () => {
    window.localStorage.setItem(STORAGE_KEY, HREF);
    runPreapply();
    expect(linkEl()?.getAttribute('href')).toBe(HREF);
  });

  it('applies nothing when no theme is stored', () => {
    runPreapply();
    expect(linkEl()).toBeNull();
  });

  // A registry sheet 401s once the session has lapsed (#379). Kept, the next
  // login adopted it with the same href, which never refetched.
  it('drops a theme that fails to load, and its stored href', () => {
    window.localStorage.setItem(STORAGE_KEY, HREF);
    runPreapply();
    linkEl()!.dispatchEvent(new Event('error'));

    expect(linkEl()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('leaves the link alone once StylesheetInjector has moved it on', () => {
    window.localStorage.setItem(STORAGE_KEY, HREF);
    runPreapply();
    const link = linkEl()!;
    link.href = '/stylesheets/kuro.css';
    window.localStorage.setItem(STORAGE_KEY, '/stylesheets/kuro.css');
    link.dispatchEvent(new Event('error'));

    expect(linkEl()).toBe(link);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      '/stylesheets/kuro.css'
    );
  });
});
