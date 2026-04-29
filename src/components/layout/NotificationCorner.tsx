import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useDeleteNotificationMutation
} from '../../store/services/notificationApi';
import { useGetUnreadCountQuery } from '../../store/services/messagesApi';

const NotificationCorner = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useGetNotificationsQuery();
  const [deleteNotification] = useDeleteNotificationMutation();
  const { data: pmData } = useGetUnreadCountQuery();

  const pmCount = pmData?.count ?? 0;
  const notifCount = notifications?.length ?? 0;
  const totalCount = pmCount + notifCount;

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

  return (
    <div
      ref={panelRef}
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
    >
      {open && (
        <div className="w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="px-3 py-2 bg-gray-700/60 border-b border-gray-700 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Notifications
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
            >
              ✕
            </button>
          </div>

          {pmCount > 0 && (
            <Link
              to="/private/messages"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-900/30 border-b border-gray-700/60 hover:bg-indigo-900/50 transition-colors"
            >
              <span className="text-indigo-300 text-sm font-medium">
                {pmCount} unread message{pmCount !== 1 ? 's' : ''}
              </span>
              <span className="ml-auto text-indigo-400 text-xs">
                View Inbox →
              </span>
            </Link>
          )}

          {notifCount === 0 && pmCount === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">
              No notifications
            </p>
          ) : notifCount > 0 ? (
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-700/50">
              {notifications!.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-2 px-3 py-2 hover:bg-gray-700/40 transition-colors"
                >
                  <span className="flex-1 text-sm text-gray-200 leading-snug">
                    {n.quoter.username} quoted you on {n.page} #{n.pageId}
                  </span>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors text-xs shrink-0 mt-0.5"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <button
        onClick={() => setOpen((s) => !s)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg border transition-colors ${
          open
            ? 'bg-gray-700 border-gray-500 text-white'
            : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        aria-label="Notifications"
      >
        🔔
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 leading-none">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationCorner;
