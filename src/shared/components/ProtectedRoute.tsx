import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  children: ReactNode;
  requireRole?: 'restaurant_owner' | 'admin';
}

export function ProtectedRoute({ children, requireRole }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && user?.role && user.role !== requireRole && user.role !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
