import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { BBCodeContent } from '../../components/ui';
import { setCredentials } from '../../store/slices/authSlice';
import { renderWithProviders, createTestStore } from '../testUtils';

// The exact markup stellar-api emits for a viewer who has opted out (api#400).
// stellar-api's bbcode.spec.ts pins this same string on its side, so a change to
// the API's notice fails there with a comment naming this file.
const NOTICE = '<div class="bbcode-mature-hidden">Mature content hidden.</div>';

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(setCredentials({ id: 7 } as never));
  return store;
};

describe('BBCodeContent', () => {
  it('applies the .bbcode-content wrapper every BBCode rule is scoped under', () => {
    // UserProfile rendered without it, so its prose was unstyled. Owning the
    // wrapper here is the fix; this asserts the component cannot forget it.
    const { container } = renderWithProviders(
      <BBCodeContent html="<strong>hi</strong>" />
    );
    expect(container.querySelector('.bbcode-content')).not.toBeNull();
  });

  it('keeps the caller className alongside the wrapper', () => {
    const { container } = renderWithProviders(
      <BBCodeContent html="x" className="text-xs line-clamp-2" />
    );
    const el = container.querySelector('.bbcode-content');
    expect(el).toHaveClass('text-xs', 'line-clamp-2');
  });

  it('renders as another element when asked — StaffPage needs a span', () => {
    const { container } = renderWithProviders(
      <BBCodeContent as="span" html="x" />
    );
    expect(container.querySelector('span.bbcode-content')).not.toBeNull();
  });

  it('sanitizes: a script survives neither the API nor this second net', () => {
    const { container } = renderWithProviders(
      <BBCodeContent html={'<script>alert(1)</script><strong>ok</strong>'} />
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('ok');
  });

  describe('the mature-content notice', () => {
    it('turns the API class into a real anchor at the viewer own settings', () => {
      // A real <a href>, not a clickable div: tab-focusable, right-click-openable
      // and announced as a link. The API ships no URL because it does not own
      // this app routing, so the href is built here from the session (ui#311).
      renderWithProviders(<BBCodeContent html={NOTICE} />, {
        store: signedIn()
      });
      const link = screen.getByRole('link', { name: /enable in settings/i });
      expect(link).toHaveAttribute('href', '/user/edit/7');
    });

    it('routes in-app rather than reloading the page', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Routes>
          <Route path="/" element={<BBCodeContent html={NOTICE} />} />
          <Route path="/user/edit/:id" element={<p>settings reached</p>} />
        </Routes>,
        { store: signedIn() }
      );

      await user.click(
        screen.getByRole('link', { name: /enable in settings/i })
      );
      expect(screen.getByText('settings reached')).toBeInTheDocument();
    });

    it('links every notice when a body carries more than one', () => {
      renderWithProviders(
        <BBCodeContent html={`${NOTICE}<p>between</p>${NOTICE}`} />,
        { store: signedIn() }
      );
      expect(
        screen.getAllByRole('link', { name: /enable in settings/i })
      ).toHaveLength(2);
    });

    it('leaves the notice as plain text when there is no session to link to', () => {
      // Defensive: every member surface is behind a session, so this should not
      // arise. Linking nowhere would be worse than not linking.
      renderWithProviders(<BBCodeContent html={NOTICE} />);
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.getByText(/mature content hidden/i)).toBeInTheDocument();
    });

    it('leaves ordinary prose untouched', () => {
      const { container } = renderWithProviders(
        <BBCodeContent html="<strong>ordinary</strong>" />,
        { store: signedIn() }
      );
      expect(container.querySelector('a')).toBeNull();
    });

    it('does not hijack clicks on other links in the same body', async () => {
      // The handler is delegated on the wrapper, so it sees every click inside
      // it. It must act only on its own injected anchor.
      // A hash href, so jsdom can follow it natively without the "navigation not
      // implemented" noise a cross-page href would produce. The discriminator
      // under test is the CLASS, not the target, so this exercises the same
      // branch: an anchor the delegated handler must decline to claim.
      const user = userEvent.setup();
      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <BBCodeContent
                html={`<a class="bbcode-link" href="#somewhere">a wiki link</a>`}
              />
            }
          />
          <Route path="/user/edit/:id" element={<p>settings reached</p>} />
        </Routes>,
        { store: signedIn() }
      );

      await user.click(screen.getByRole('link', { name: 'a wiki link' }));
      expect(screen.queryByText('settings reached')).toBeNull();
    });
  });
});
