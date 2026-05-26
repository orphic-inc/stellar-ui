import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation
} from '../../store/services/notificationApi';

const GlobalNoticeBanner = () => {
  const { data: notifications } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();

  const unreadNotices = (notifications ?? []).filter(
    (n) => n.readAt === null && n.type === 'global_notice'
  );

  if (unreadNotices.length === 0) return null;

  return (
    <div className="space-y-px">
      {unreadNotices.map((n) => (
        <div
          key={n.id}
          className="flex items-center justify-between gap-4 bg-amber-900/70 border-b border-amber-700 px-4 py-2 text-sm text-amber-100"
        >
          <span>
            {n.source?.url ? (
              <a
                href={n.source.url}
                className="underline hover:text-white transition-colors"
              >
                {n.source.title}
              </a>
            ) : (
              n.source?.title
            )}
          </span>
          <button
            type="button"
            onClick={() => markRead(n.id)}
            className="shrink-0 text-amber-300 hover:text-white transition-colors text-xs"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
};

export default GlobalNoticeBanner;
