import { Navigate } from 'react-router-dom';
import { getToken, getUser, roleHome, type Role } from '../lib/auth';

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (getToken() && user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }
  return <>{children}</>;
}

export function ProtectedRoute({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = getUser();
  if (!getToken() || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to={roleHome(user.role)} replace />;
  }
  return <>{children}</>;
}
