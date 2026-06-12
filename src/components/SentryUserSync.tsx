import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../store/slices/authSlice';
import { sentryUserFromAuthUser } from '../utils/sentry';

/**
 * Keeps Sentry's user context in sync with auth state — set on login, clear on
 * logout — so errors carry who-hit-them. Renders nothing; lives as its own
 * component (mounted inside the Redux Provider) so the routing root stays free
 * of store coupling.
 */
const SentryUserSync = (): null => {
  const currentUser = useSelector(selectCurrentUser);
  useEffect(() => {
    Sentry.setUser(sentryUserFromAuthUser(currentUser));
  }, [currentUser]);
  return null;
};

export default SentryUserSync;
