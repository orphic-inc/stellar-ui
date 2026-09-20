import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  useGetNewsQuery,
  type NewsItem
} from '../../../store/services/announcementApi';
import Time from '../../layout/Time';
import Spinner from '../../layout/Spinner';

/**
 * Site news, with an addressable anchor per item (#348).
 *
 * `news.xml` (stellar-api#262) publishes FEED_SIZE items and links each one to
 * `/#news-<id>` here, so a reader arriving from a feed reader must be able to
 * reach an item well past the handful the homepage shows at rest. That is what
 * the paginated list (stellar-api#670) is for: the panel starts small and
 * grows, either because the reader asked or because a fragment named something
 * further back.
 */

/** Rows at rest — what the homepage showed before this panel could grow. */
const INITIAL_LIMIT = 5;

/** Added per "Load more", matching the legacy implementation's server cap. */
const LOAD_MORE_STEP = 10;

/**
 * How far a fragment will reach before giving up. Deliberately the feed's
 * FEED_SIZE: the feed is what publishes these links, so an item it never
 * carried is one no reader can have followed here.
 */
const FRAGMENT_REACH = 50;

const HIGHLIGHT_MS = 1500;

const NEWS_HASH = /^#news-(\d+)$/;

const newsIdFromHash = (hash: string): number | null => {
  const match = NEWS_HASH.exec(hash);
  return match ? Number(match[1]) : null;
};

/**
 * `global.css`'s reduced-motion block disables `transition`, not
 * `scroll-behavior`, so an animated scroll is not covered by it. Ask directly.
 */
const scrollBehaviour = (): ScrollBehavior =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

const NewsRow = ({
  item,
  isExpanded,
  isHighlighted,
  onToggle
}: {
  item: { id: number; title: string; body: string; createdAt: string };
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
}) => (
  <div
    id={`news-${item.id}`}
    // Focusable so following a feed link announces the item to assistive tech;
    // `scrollIntoView` moves the viewport but never focus. -1 keeps it out of
    // the tab order, since the button inside is the real control.
    tabIndex={-1}
    className={isHighlighted ? 'bg-[var(--st-fill-hover)]' : undefined}
  >
    <button
      type="button"
      onClick={onToggle}
      data-st="row"
      {...(isExpanded ? { 'data-st-open': '' } : {})}
      className="w-full text-left cursor-pointer"
    >
      <span
        data-st="prose"
        data-st-strong
        className="flex-1 min-w-0 truncate text-sm"
      >
        {item.title}
      </span>
      <span
        data-st="meta"
        className="text-xs shrink-0 ml-4 flex items-center gap-2"
      >
        <Time date={item.createdAt} />
        <span>{isExpanded ? '▲' : '▼'}</span>
      </span>
    </button>
    {isExpanded && item.body && (
      <div
        data-st="prose"
        className="px-3 pb-4 text-sm"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body) }}
      />
    )}
  </div>
);

/**
 * Bring the named item into view and give it focus, reporting whether it was
 * there to find. `scrollIntoView` moves the viewport but never focus, so a
 * reader following a feed link with a screen reader would otherwise get no
 * announcement that anything happened.
 */
const revealItem = (id: number): boolean => {
  const element = document.getElementById(`news-${id}`);
  if (!element) return false;
  element.scrollIntoView?.({ behavior: scrollBehaviour(), block: 'center' });
  element.focus?.();
  return true;
};

/** The rows and the server's total, defaulted for the pre-load render. */
const readPage = (data?: { data: NewsItem[]; meta: { total: number } }) => ({
  items: data?.data ?? [],
  total: data?.meta.total ?? 0
});

const NewsList = ({
  items,
  isLoading,
  expanded,
  highlighted,
  onToggle
}: {
  items: NewsItem[];
  isLoading: boolean;
  expanded: number | null;
  highlighted: number | null;
  onToggle: (id: number | null) => void;
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <Spinner />
      </div>
    );
  }
  if (!items.length) {
    return (
      <p data-st="prose" data-st-muted className="p-4 text-sm">
        No announcements.
      </p>
    );
  }
  return (
    <>
      {items.map((item) => (
        <NewsRow
          key={item.id}
          item={item}
          isExpanded={expanded === item.id}
          isHighlighted={highlighted === item.id}
          onToggle={() => onToggle(expanded === item.id ? null : item.id)}
        />
      ))}
    </>
  );
};

const NewsPanel = () => {
  const { hash } = useLocation();
  const targetId = newsIdFromHash(hash);
  const [manualLimit, setManualLimit] = useState(INITIAL_LIMIT);

  // A fragment names an item that may sit well past the rows shown at rest,
  // and there is no way to know where without looking — so ask for the whole
  // reach up front rather than fetching the short list and escalating, which
  // would mean two round trips and a cascading render.
  const limit =
    targetId === null ? manualLimit : Math.max(manualLimit, FRAGMENT_REACH);

  const { data, isLoading } = useGetNewsQuery({ page: 1, limit });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [appliedHash, setAppliedHash] = useState<string | null>(null);

  // Open and mark the item the fragment names. Done during render rather than
  // in an effect — React's documented way to adjust state when an input
  // changes — so there is no second commit, and a reader who then collapses
  // the item keeps it collapsed until the hash changes again.
  if (hash !== appliedHash) {
    setAppliedHash(hash);
    setExpanded(targetId);
    setHighlighted(targetId);
  }

  const { items, total } = readPage(data);
  const hasMore = items.length < total;

  // Derived, not stored: the item is unreachable exactly when the list has
  // loaded its full reach and still does not contain what the fragment named.
  const unreachable =
    targetId !== null && !!data && !items.some((i) => i.id === targetId);

  // Bring the named item into view once the list has loaded, and again on a
  // hash change — a reader clicking a second feed link keeps this tab mounted,
  // so waiting for a remount would silently do nothing.
  useEffect(() => {
    if (targetId === null || !revealItem(targetId)) return;
    const timer = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [targetId, data]);

  return (
    <div data-st="panel">
      <div data-st="colhead">
        <h2>Announcements</h2>
      </div>
      <div data-st="list">
        {unreachable && (
          <p data-st="meta" className="px-4 pt-3 text-sm">
            That news item is no longer shown here.
          </p>
        )}
        <NewsList
          items={items}
          isLoading={isLoading}
          expanded={expanded}
          highlighted={highlighted}
          onToggle={setExpanded}
        />
      </div>
      {hasMore && (
        <div className="p-3 text-center border-t border-[var(--st-border-subtle)]">
          <button
            type="button"
            data-st="control"
            className="text-sm"
            onClick={() =>
              setManualLimit((current) => current + LOAD_MORE_STEP)
            }
          >
            Load more news
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsPanel;
