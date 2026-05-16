import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../../../../store/services/authApi';
import PrivateHeader from './PrivateHeader';
import PrivateFooter from './PrivateFooter';
import NotificationCorner from '../../../layout/NotificationCorner';
import Spinner from '../../../layout/Spinner';

interface Props {
  children: ReactNode;
}

const PrivateLayout = ({ children }: Props) => {
  const { isLoading, isError, isUninitialized, data: user } = useGetMeQuery();

  if (isUninitialized || isLoading) return <Spinner />;
  if (isError || !user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <PrivateHeader user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <PrivateFooter />
      <NotificationCorner />
    </div>
  );
};

export default PrivateLayout;
