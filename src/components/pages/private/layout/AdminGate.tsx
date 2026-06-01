import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../../../../store/services/authApi';
import { hasStrictAdmin } from '../../../../utils/permissions';

const AdminGate = ({ children }: { children: ReactElement }) => {
  const { data: user } = useGetMeQuery();
  if (!user || !hasStrictAdmin(user)) return <Navigate to="/private" replace />;
  return children;
};

export default AdminGate;
