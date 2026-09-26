import { ReactNode, useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../../../store/hooks';
import { useGetMeQuery } from '../../../../store/services/authApi';
import { hasNotificationFilters } from '../../../../store/services/notificationFilterApi';
import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../../store/slices/authSlice';
import PrivateHeader from './PrivateHeader';
import PrivateFooter from './PrivateFooter';
import NotificationCorner from '../../../layout/NotificationCorner';
import GlobalNoticeBanner from '../../../layout/GlobalNoticeBanner';
import RatioPolicyBanner from '../../../ratio/RatioPolicyBanner';
import StylesheetInjector from '../../../layout/StylesheetInjector';
import Spinner from '../../../layout/Spinner';

// The ratio policy banner reads the session, and three of the four things that
// move that state are not member actions: the daily sweep, a staff override,
// and the api's own post-response evaluation of a download. Invalidation on the
// download mutations catches only the last, and only when it wins the race —
// so without a timer a swept or staff-disabled member sees nothing until they
// reload. Nothing calls `setupListeners`, so `refetchOnFocus` is unavailable
// without a global change and a surface needing fresh state must poll itself.
// 15 minutes rather than ModBar's 5: ratio policy moves at most daily.
const RATIO_POLICY_POLL_MS = 15 * 60 * 1000;

interface Props {
  children: ReactNode;
}

const PrivateLayout = ({ children }: Props) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const {
    isLoading,
    isError,
    isUninitialized,
    data: fetchedUser
  } = useGetMeQuery(undefined, { pollingInterval: RATIO_POLICY_POLL_MS });
  const user = currentUser ?? fetchedUser;
  // The theme gate (#161): content paints only in the member's own theme.
  const [themeReady, setThemeReady] = useState(false);
  const markThemeReady = useCallback(() => setThemeReady(true), []);

  if (isUninitialized || (isLoading && !user)) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isError && !user) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;

  // The injector sits outside the shell so it stays mounted, in the same
  // place, while the spinner holds: it is what resolves the theme, and its
  // unmount cleanup would remove it (#379).
  return (
    <>
      <StylesheetInjector onReady={markThemeReady} />
      {themeReady ? <Shell user={user}>{children}</Shell> : <Spinner />}
    </>
  );
};

const Shell = ({
  user,
  children
}: {
  user: NonNullable<ReturnType<typeof selectCurrentUser>>;
  children: ReactNode;
}) => (
  <div className="min-h-screen bg-[var(--st-base)] text-[var(--st-text)] flex flex-col">
    <PrivateHeader user={user} />
    {/* Above the global notices: those are announcements addressed to
          everyone and are dismissible, this is enforcement addressed to you,
          with a deadline and a consequence. */}
    <RatioPolicyBanner user={user} />
    <GlobalNoticeBanner />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
      {children}
    </main>
    <PrivateFooter />
    <NotificationCorner showFilterHits={hasNotificationFilters(user)} />
  </div>
);

export default PrivateLayout;
