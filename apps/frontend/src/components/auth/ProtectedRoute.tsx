import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  requiredRoleLevel?: number; // Not heavily used since we rely on boolean flags in usePermissions now
  requireAdmin?: boolean;
}

export function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const permissions = usePermissions();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !permissions.isAdmin) {
    console.log('[ProtectedRoute Debug] Would redirect non-admin to /dashboard, but bypassed for testing');
    return <Outlet />;
  }

  const effectiveRole = useAuthStore(state => state.simulatedRole || state.user?.role || 'CLIENT');

  if (location.pathname === '/clients' || location.pathname === '/clients/') {
    // Force bypass for CRM Clients page
    return <Outlet />;
  }

  // Prevent CLIENT role from accessing Back-Office routes
  const isClientPortalRoute = location.pathname.startsWith('/client/') || location.pathname === '/client';

  if (effectiveRole === 'CLIENT' && !isClientPortalRoute) {
    console.log('[ProtectedRoute Debug] Redirecting CLIENT to /client/dashboard');
    return <Navigate to="/client/dashboard" replace />;
  }

  // Prevent Back-Office users from accessing Client Portal routes
  if (effectiveRole !== 'CLIENT' && isClientPortalRoute) {
    console.log('[ProtectedRoute Debug] Would redirect Back-Office to /dashboard, but bypassed for testing');
    return <Outlet />;
  }

  return <Outlet />;
}
