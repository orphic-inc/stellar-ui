import { useAppSelector } from '../store/hooks';
import { useGetMeQuery } from '../store/services/authApi';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import PublicLayout from './pages/public/PublicLayout';
import PublicLanding from './pages/public/PublicLanding';
import PrivateLayout from './pages/private/layout/PrivateLayout';
import PrivateContent from './pages/private/layout/PrivateContent';
import Spinner from './layout/Spinner';

// Root route arbiter: members get the private homepage at "/", visitors get
// the public landing — no client-side bounce through a prefixed URL (#183).
const HomeGate = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { isLoading, isUninitialized, data: me } = useGetMeQuery();

  // Wait for the session probe so visitors don't flash the wrong home.
  if (isUninitialized || isLoading) return <Spinner />;

  if (isAuthenticated || me) {
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
