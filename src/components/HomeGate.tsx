import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { useGetMeQuery } from '../store/services/authApi';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import PublicLayout from './pages/public/PublicLayout';
import PublicLanding from './pages/public/PublicLanding';
import PrivateLayout from './pages/private/layout/PrivateLayout';
import PrivateContent from './pages/private/layout/PrivateContent';
import Spinner from './layout/Spinner';

// The element for "/" and every private path. Members get the private app,
// visitors at "/" get the public landing — no client-side bounce through a
// prefixed URL (#183). One element for all of them keeps the member's layout a
// single instance for the whole session: when "/" had a route of its own, every
// crossing to or from home remounted it and re-created the theme link (#161).
const HomeGate = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { isLoading, isUninitialized, data: me } = useGetMeQuery();
  const { pathname } = useLocation();

  // Wait for the session probe so visitors don't flash the wrong home.
  if (isUninitialized || isLoading) return <Spinner />;

  // A visitor anywhere but "/" gets PrivateLayout too, which sends them to
  // /login as it always has.
  if (isAuthenticated || me || pathname !== '/') {
    return (
      <PrivateLayout>
        <PrivateContent />
      </PrivateLayout>
    );
  }

  return (
    <PublicLayout>
      <PublicLanding />
    </PublicLayout>
  );
};

export default HomeGate;
