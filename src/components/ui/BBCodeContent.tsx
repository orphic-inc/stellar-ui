import { useMemo } from 'react';
import type { ComponentPropsWithoutRef, ElementType, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  BBCODE_ALLOWED_TAGS,
  BBCODE_ALLOWED_ATTR
} from '../../utils/bbcodeSanitize';

type BBCodeContentProps = {
  /** The API's server-transcribed `bodyHtml` (#398/#402). */
  html: string | null | undefined;
  className?: string;
  /** Render as a different element — `StaffPage` injects into a table cell. */
  as?: ElementType;
} & Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'children' | 'dangerouslySetInnerHTML'
>;

// The class stellar-api stamps on its gated-content notice (api#400). The API
// renders `<div class="bbcode-mature-hidden">Mature content hidden.</div>` and
// deliberately embeds no URL: it does not own this app's routing, so it ships a
// class and we turn it into a link (ui#311). That markup is the entire coupling
// between the two repos here, and stellar-api's bbcode.spec.ts pins it as an
// exact string so the API half cannot drift without a failing test naming us.
//
// Matched on the CLASS rather than the full string on purpose: the class is the
// documented contract, so the API may reword the copy without silently breaking
// the link. Non-greedy to the first `</div>` — the notice has no nested markup.
const MATURE_NOTICE_RE = /(<div class="bbcode-mature-hidden">.*?)(<\/div>)/g;
const SETTINGS_LINK_CLASS = 'bbcode-mature-settings';

/**
 * The single seam every BBCode surface renders through.
 *
 * It owns three things that were previously copy-pasted or missing per site:
 *
 *  1. **The sanitize call.** The API sanitizes `bodyHtml` server-side (belt);
 *     this is the second net on inject (suspenders). Six call sites each inlined
 *     the identical three lines, which is six places for the allowlist to drift.
 *  2. **The `.bbcode-content` wrapper.** All BBCode CSS is scoped under it, and
 *     `UserProfile` was rendering without it — so profile-info quotes, code and
 *     lists were unstyled. Owning the wrapper here makes that unforgettable.
 *  3. **The mature-notice link.** A real `<a>`, so it is tab-focusable,
 *     right-click-openable and announced as a link, with the click intercepted
 *     for SPA navigation rather than a full page load.
 *
 * The anchor is injected AFTER sanitizing, not before: `BBCODE_ALLOWED_ATTR`
 * carries no `data-*`, and routing our own static markup through the allowlist
 * buys nothing — the only interpolated value is a number from the auth store.
 */
const BBCodeContent = ({
  html,
  className,
  as: Tag = 'div',
  ...rest
}: BBCodeContentProps) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  // Coerced rather than trusted: this value is interpolated into markup that is
  // injected without a further sanitize pass, so the guarantee should hold at
  // runtime and not only in the type. A non-numeric id yields no link at all.
  const rawId = currentUser?.id;
  const userId = Number.isInteger(rawId) ? (rawId as number) : null;

  const rendered = useMemo(() => {
    const clean = DOMPurify.sanitize(html ?? '', {
      ALLOWED_TAGS: BBCODE_ALLOWED_TAGS,
      ALLOWED_ATTR: BBCODE_ALLOWED_ATTR
    });
    // No id means no settings page to point at. Every member surface is behind a
    // session (see AGENTS.md), so this is the defensive arm rather than a real
    // state — leave the notice as plain text rather than link it nowhere.
    if (userId == null) return clean;
    return clean.replace(
      MATURE_NOTICE_RE,
      `$1 <a class="${SETTINGS_LINK_CLASS}" href="/user/edit/${userId}">Enable in settings</a>$2`
    );
  }, [html, userId]);

  // Delegated: the anchor lives inside injected HTML, so it has no React handler
  // of its own. Intercept it into the router instead of letting the browser do a
  // full page load — the `href` stays real so the link still behaves like one
  // for keyboard, middle-click and right-click-open.
  const onClick = (e: MouseEvent<HTMLElement>) => {
    const link = (e.target as HTMLElement).closest?.(
      `a.${SETTINGS_LINK_CLASS}`
    );
    if (!link) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(`/user/edit/${userId}`);
  };

  return (
    // `dangerouslySetInnerHTML` is the point of this component, not an oversight,
    // and consolidating it here is what makes it reviewable: six call sites did
    // this individually before. The markup is sanitized twice — once by the API
    // before it ships (#398/#402), once above on inject with the mirrored
    // allowlist — and the only thing this file adds to it is an anchor built
    // from a checked integer.
    <Tag
      className={className ? `bbcode-content ${className}` : 'bbcode-content'}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: rendered }}
      {...rest}
    />
  );
};

export default BBCodeContent;
