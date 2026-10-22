import { Navigate, Outlet } from "react-router-dom";
import PageLoader from "@/components/ui/PageLoader";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "./AuthContext";

// App pages: signed-out visitors go to /login.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}

// Login / sign up: signed-in users skip straight to the dashboard.
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Outlet />;
}
