import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../../store/services/authApi';
import { hasAnyPermission, type Permission } from '../../utils/permissions';

type StaffGateProps = {
  permissions: Permission[];
  children: ReactElement;
};

const StaffGate = ({ permissions, children }: StaffGateProps) => {
  const { data: user } = useGetMeQuery();

  if (!user || !hasAnyPermission(user, permissions)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default StaffGate;
