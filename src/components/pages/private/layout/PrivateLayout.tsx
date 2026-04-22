import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetMeQuery } from '../../../../store/services/authApi';
import { selectCurrentUser } from '../../../../store/slices/authSlice';
import PrivateHeader from './PrivateHeader';
import PrivateFooter from './PrivateFooter';
import Spinner from '../../../layout/Spinner';

interface Props {
  children: ReactNode;
}

const PrivateLayout = ({ children }: Props) => {
  const { isLoading } = useGetMeQuery();
  const user = useSelector(selectCurrentUser);

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div id="site-wrapper">
      <PrivateHeader user={user} />
      <div id="content">{children}</div>
      <PrivateFooter />
    </div>
  );
};

export default PrivateLayout;
