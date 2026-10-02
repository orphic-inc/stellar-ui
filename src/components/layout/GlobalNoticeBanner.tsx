import { useDispatch } from 'react-redux';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation
} from '../../store/services/notificationApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';

const GlobalNoticeBanner = () => {
  const { data: notifications } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const dispatch = useDispatch();

  // Dismissing is something the reader does, unlike a read on opening, so a
  // refusal is said (#462).
  const handleDismiss = async (id: number) => {
    try {
      await markRead(id).unwrap();
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to dismiss the notice.',
          'danger'
        )
      );
    }
  };

  const unreadNotices = (notifications ?? []).filter(
    (n) => n.readAt === null && n.type === 'global_notice'
  );

  if (unreadNotices.length === 0) return null;

  return (
    <div className="space-y-px">
      {unreadNotices.map((n) => (
        <div
          key={n.id}
          className="flex items-center justify-between gap-4 border-b border-[color-mix(in_oklch,var(--st-warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-warning)_12%,transparent)] px-4 py-2 text-sm text-[var(--st-warning)]"
        >
          <span>
            {n.source?.url ? (
              <a
                href={n.source.url}
                className="underline hover:text-[var(--st-text-strong)] transition-colors"
              >
                {n.source.title}
              </a>
            ) : (
              n.source?.title
            )}
          </span>
          <button
            type="button"
            onClick={() => handleDismiss(n.id)}
            className="shrink-0 hover:text-[var(--st-text-strong)] transition-colors text-xs"
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
