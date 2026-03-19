import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../lib/permissions';

interface Props {
  children: ReactNode;
  /** Require an exact role (used for top-level app guard) */
  requireRole?: 'restaurant_owner' | 'admin';
  /** Require permission for a specific resource/page */
  requireResource?: string;
}

export function ProtectedRoute({ children, requireRole, requireResource }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Top-level role guard (owner-only app shell)
  if (requireRole && user?.role && user.role !== requireRole && user.role !== 'admin') {
    // Allow managers and other staff through — they have a valid role
    const staffRoles = ['manager', 'cashier', 'waiter', 'chef', 'delivery'];
    if (!staffRoles.includes(user.role)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  // Fine-grained resource guard
  if (requireResource && !hasPermission(user?.role, requireResource)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}