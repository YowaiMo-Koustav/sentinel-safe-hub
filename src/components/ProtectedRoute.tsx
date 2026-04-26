import { Navigate, useLocation } from "react-router-dom";
import { type ReactNode } from "react";
import { useExpressAuth, type AppRole } from "@/lib/ExpressAuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, only these roles may access. Admin is always allowed. */
  allow?: AppRole[];
}

export function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const { user, roles, loading } = useExpressAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow && !roles.some((r) => allow.includes(r) || r === "admin")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Access restricted</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your role doesn't have permission to view this page. Contact an administrator if you think this is a mistake.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
