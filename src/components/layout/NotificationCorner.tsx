import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  type Notification,
  type NotificationType
} from '../../store/services/notificationApi';
import { useGetUnreadCountQuery } from '../../store/services/messagesApi';

function renderNotificationText(
  type: NotificationType,
  actorName: string | undefined,
  sourceTitle: string | undefined
): string {
  const actor = actorName ?? 'Someone';
  const title = sourceTitle ?? 'an item';
  switch (type) {
    case 'forum_quote':
      return `${actor} quoted you in ${title}`;
    case 'forum_sub':
      return `${actor} posted in ${title}`;
    case 'request_filled':
      return `${actor} filled a request for ${title}`;
    case 'collage_updated':
      return `${actor} added to ${title}`;
    case 'comment_sub':
      return `${actor} commented on ${title}`;
    case 'artist_release':
      return `${actor} added a new contribution for ${title}`;
    case 'site_news':
      return `New announcement: ${title}`;
    case 'global_notice':
      return title;
    default:
      return `New notification in ${title}`;
  }
}

function sourcePath(n: Notification): string | null {
  if (!n.source) return null;
  switch (n.page) {
    case 'forums':
      return `/private/forums/${n.source.forumId}/topics/${n.pageId}#post${n.postId}`;
    case 'artist':
      return `/private/artists/${n.pageId}`;
    case 'contributions':
    case 'release':
      if (!n.source?.releaseId || !n.source?.communityId) return null;
      return `/private/communities/${n.source.communityId}/releases/${n.source.releaseId}`;
    case 'collages':
      return `/private/collages/${n.pageId}`;
    case 'requests':
      return `/private/requests/${n.pageId}`;
    case 'communities':
      return `/private/communities/${n.pageId}`;
    case 'news':
      return `/private/announcements`;
    case 'global_notices':
      return n.source?.url ?? null;
    default:
      return null;
  }
}

const NotificationCorner = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useGetNotificationsQuery();
  const { data: unreadNotifData } = useGetUnreadNotificationCountQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const { data: pmData } = useGetUnreadCountQuery();

  const pmCount = pmData?.count ?? 0;
  const unreadNotifCount = unreadNotifData?.count ?? 0;
  const totalCount = pmCount + unreadNotifCount;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (totalCount === 0) return null;

  const notifCount = notifications?.length ?? 0;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
    >
      {open && (
        <div data-st="panel" className="w-80 shadow-2xl">
          <div data-st="colhead">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              {unreadNotifCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  data-st="control"
                  className="text-xs"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--st-text-faint)] hover:text-[var(--st-text)] transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {pmCount > 0 && (
            <Link
              to="/private/messages"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 border-b border-[var(--st-border-subtle)] bg-[color-mix(in_oklch,var(--st-accent)_15%,transparent)] hover:bg-[color-mix(in_oklch,var(--st-accent)_25%,transparent)] transition-colors"
            >
              <span className="text-[var(--st-link-hover)] text-sm font-medium">
                {pmCount} unread message{pmCount !== 1 ? 's' : ''}
              </span>
              <span className="ml-auto text-[var(--st-link)] text-xs">
                View Inbox →
              </span>
            </Link>
          )}

          {notifCount === 0 && pmCount === 0 ? (
            <p data-st="meta" className="px-3 py-4 text-sm text-center">
              No notifications
            </p>
          ) : notifCount > 0 ? (
            <ul data-st="list" className="max-h-64 overflow-y-auto">
              {notifications!.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <li
                    key={n.id}
                    data-st="row"
                    data-st-open={isUnread ? '' : undefined}
                    className="items-start"
                  >
                    {isUnread && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--st-accent-ring)] shrink-0" />
                    )}
                    <span
                      className={`flex-1 text-sm leading-snug ${
                        isUnread
                          ? 'text-[var(--st-text-strong)]'
                          : 'text-[var(--st-text-muted)]'
                      }`}
                    >
                      {sourcePath(n) ? (
                        <Link
                          to={sourcePath(n)!}
                          onClick={() => {
                            if (isUnread) markRead(n.id);
                            setOpen(false);
                          }}
                          className="hover:text-[var(--st-link-hover)] transition-colors"
                        >
                          {renderNotificationText(
                            n.type,
                            n.actor?.username,
                            n.source?.title
                          )}
                        </Link>
                      ) : (
                        renderNotificationText(
                          n.type,
                          n.actor?.username,
                          `${n.page} #${n.pageId}`
                        )
                      )}
                    </span>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-[var(--st-text-faint)] hover:text-[var(--st-danger)] transition-colors text-xs shrink-0 mt-0.5"
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}

      <button
        onClick={() => setOpen((s) => !s)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg border transition-colors ${
          open
            ? 'bg-[var(--st-raised)] border-[var(--st-border-strong)] text-[var(--st-text-strong)]'
            : 'bg-[var(--st-panel)] border-[var(--st-border-strong)] text-[var(--st-text-muted)] hover:text-[var(--st-text-strong)] hover:bg-[var(--st-raised)]'
        }`}
        aria-label="Notifications"
      >
        🔔
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--st-danger)] text-[var(--st-text-strong)] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 leading-none">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationCorner;
