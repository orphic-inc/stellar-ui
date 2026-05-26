import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../../../store/hooks';
import { useGetMeQuery } from '../../../../store/services/authApi';
import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../../store/slices/authSlice';
import PrivateHeader from './PrivateHeader';
import PrivateFooter from './PrivateFooter';
import NotificationCorner from '../../../layout/NotificationCorner';
import GlobalNoticeBanner from '../../../layout/GlobalNoticeBanner';
import Spinner from '../../../layout/Spinner';

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
  } = useGetMeQuery();
  const user = currentUser ?? fetchedUser;

  if (isUninitialized || (isLoading && !user)) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isError && !user) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <PrivateHeader user={user} />
      <GlobalNoticeBanner />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <PrivateFooter />
      <NotificationCorner />
    </div>
  );
};

export default PrivateLayout;
