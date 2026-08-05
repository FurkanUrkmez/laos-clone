import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

export function ProtectedRoute() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAdminAuthStore((state) => state.isHydrating);

  if (isHydrating) {
    return <p style={{ padding: 32 }}>Yükleniyor...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
